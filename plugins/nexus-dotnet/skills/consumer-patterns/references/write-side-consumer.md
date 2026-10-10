# Template: write-side aggregate-creation consumer

The richest shape — all five phases, reference-data hydration, file copying, and the **throw on duplicate**
idempotency variant. A fulfilment service creates a `Shipment` aggregate when the ordering service places an order.
Substitute your own aggregate, event and reference data.

Folder convention: the consumer lives in `Features/{Area}/{Operation}/` of the project that registers the bus — here
`Features/Shipments/CreateFromOrder/`.

```csharp file=OrderPlacedConsumer.cs
public class OrderPlacedConsumer(
    FulfilmentDbContext _dbContext,
    ShipmentRepository _shipmentRepository,
    Repository<Customer> _customerRepository,
    IFileService _fileService,
    IFileService<OrderingFileStorageOptions> _orderingFileService)
    : IConsumer<OrderPlacedEvent>
{
    public async Task Consume(ConsumeContext<OrderPlacedEvent> context)
    {
        var order = context.Message.Order;
        var ct = context.CancellationToken;

        if (await _shipmentRepository.ExistsForOrderAsync(order.Id, ct))
            throw new AlreadyExistsException($"Order {order.Id} already has a shipment.");

        var customer = await GetOrCreateCustomerAsync(order.Customer, ct);
        var documents = await CopyDocumentsAsync(order.Documents, ct);

        var shipment = Shipment.FromOrder(order.Id, customer, documents, ShipmentAction.FromOrder(order));
        await _shipmentRepository.AddAsync(shipment, ct);

        await _dbContext.SaveChangesAsync(ct);
    }

    private async Task<Customer> GetOrCreateCustomerAsync(CustomerContract contract, CancellationToken ct)
    {
        var customer = await _customerRepository.GetByIdAsync(contract.Id, ct);
        if (customer is not null)
            return customer;

        customer = new Customer
        {
            Id = contract.Id,
            Name = contract.Name,
            Email = contract.Email
        };
        await _customerRepository.AddAsync(customer, ct);

        return customer;
    }

    private async Task<IReadOnlyList<ShipmentDocument>> CopyDocumentsAsync(IReadOnlyList<DocumentContract> contracts, CancellationToken ct)
    {
        var documents = new List<ShipmentDocument>();
        foreach (var contract in contracts)
        {
            var (stream, metadata) = await _orderingFileService.DownloadAsync(contract.FileId, ct);
            var copied = await _fileService.UploadAsync(
                new FileUploadRequest(metadata.StoragePath, metadata.FileName, metadata.ContentType, metadata.FileSize), stream, ct: ct);
            documents.Add(ShipmentDocument.Create(contract.Kind, copied.FileId));
        }

        return documents;
    }
}
```

Read it by phase:

1. **The class and its dependencies** — the data context and the repositories as concrete classes; the two file
   stores through their interface, the foreign one told apart by its options marker type (`file-storage-patterns`).
2. **Idempotency** — throw on duplicate: a second shipment for one order is a bug to surface; the bus moves the
   message to its error queue, where it is seen.
3. **Hydration** — `GetOrCreateCustomerAsync` looks local first and maps the contract by hand only when missing.
4. **The change** — the aggregate's factory runs its rules; the action object comes from the event (who acted and
   when, as the publishing service recorded them).
5. **One save,** with the token.

**The silent-skip variant** replaces the throw: `if (await _shipmentRepository.ExistsForOrderAsync(order.Id, ct)) return;`
— for a service that would rather absorb a redelivery than report it.

**Undo and rethrow.** Where a phase writes outside the data context before the save — the file copies above — and a
later phase fails, a `catch` may delete those copies, then `throw;` so the bus delivers again. It never swallows.
