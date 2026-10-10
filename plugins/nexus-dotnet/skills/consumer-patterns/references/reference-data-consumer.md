# Template: reference-data replicated-row consumer pair

Foreign reference data that changes on its own — a product's name, a code — is replicated into each service that
reads it by a **dedicated `{Thing}Created` / `{Thing}Updated` consumer pair**, so no read ever calls the owning
service. This is separate from the get-or-create hydration inside a write-side consumer (`write-side-consumer.md`).

Idempotency is the **silent** variant: create skips when the row exists; update upserts. A redelivery is normal and
harmless, so nothing is thrown. One concrete repository is enough for a one-table replica.

Folder convention: one folder per event, `Features/{Thing}Created/` and `Features/{Thing}Updated/`.

## Created — silent skip

```csharp file=ProductCreatedConsumer.cs
public class ProductCreatedConsumer(Repository<Product> _productRepository) : IConsumer<ProductCreatedEvent>
{
    public async Task Consume(ConsumeContext<ProductCreatedEvent> context)
    {
        var product = context.Message.Product;
        var ct = context.CancellationToken;

        if (await _productRepository.ExistsAsync(product.Id, ct))
            return;

        await _productRepository.AddAsync(product.ToProduct(), ct);
        await _productRepository.SaveChangesAsync(ct);
    }
}
```

## Updated — upsert

`UpsertAsync` adds the row when it is missing and otherwise copies the values onto the tracked row, so a duplicate
and an out-of-order delivery both end in the same state:

```csharp file=ProductUpdatedConsumer.cs
public class ProductUpdatedConsumer(Repository<Product> _productRepository) : IConsumer<ProductUpdatedEvent>
{
    public async Task Consume(ConsumeContext<ProductUpdatedEvent> context)
    {
        var ct = context.CancellationToken;

        await _productRepository.UpsertAsync(context.Message.Product.ToProduct(), ct);
        await _productRepository.SaveChangesAsync(ct);
    }
}
```

## The hand map both share

```csharp file=ProductContractExtensions.cs
public static class ProductContractExtensions
{
    public static Product ToProduct(this ProductContract contract) =>
        new()
        {
            Id = contract.Id,
            Code = contract.Code,
            Name = contract.Name
        };
}
```

`ExistsAsync` and `UpsertAsync` are methods of the repository base (`persistence-patterns`).
