# File Storage — Templates

Starting points for `file-storage-patterns`, one per phase. Names, option types and the provider are what you change
for your own service; the shapes are the pattern. Each type is its own file.

## 1. The contract

Only these types cross `IFileService`; a provider's own types stay inside its implementation. The interface exists
because production code has several implementations — one per provider, one per marker.

```csharp file=IFileService.cs
public interface IFileService
{
    Task<FileMetadata> UploadAsync(FileUploadRequest request, Stream stream, bool overwrite = false, CancellationToken ct = default);

    Task<(Stream FileStream, FileMetadata FileMetadata)> DownloadAsync(string fileId, CancellationToken ct = default);

    Task<bool> TryDeleteAsync(string fileId, CancellationToken ct = default);
}
```

```csharp file=IFileServiceOfOptions.cs
public interface IFileService<TOptions> : IFileService
    where TOptions : FileStorageOptions;
```

```csharp file=FileUploadRequest.cs
public record FileUploadRequest(string StoragePath, string FileName, string ContentType, long FileSize);
```

```csharp file=FileMetadata.cs
public record FileMetadata(string StoragePath, string FileName, string ContentType, long FileSize, string FileId);
```

```csharp file=FileStorageOptions.cs
using System.ComponentModel.DataAnnotations;

public abstract class FileStorageOptions
{
    [Required]
    public required string ConnectionStringName { get; init; }
}
```

## 2. The options marker per extra store

The provider's options, and an empty subclass per foreign store, in the service that reads it:

```csharp file=GridFsFileStorageOptions.cs
using System.ComponentModel.DataAnnotations;

public class GridFsFileStorageOptions : FileStorageOptions
{
    [Required]
    public required string DatabaseName { get; init; }

    [Required]
    public required string BucketName { get; init; }

    public int ChunkSizeBytes { get; init; } = 1024 * 1024;
}
```

```csharp file=OrderingFileStorageOptions.cs
public class OrderingFileStorageOptions : GridFsFileStorageOptions;
```

## 3. Registration (singleton default + scoped per extra)

```csharp file=GridFsFileStorageRegistration.cs
using MongoDB.Driver;
using MongoDB.Driver.GridFS;

public static class GridFsFileStorageRegistration
{
    public static IServiceCollection AddGridFsFileStorageAsSingleton(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAndValidateOptions<GridFsFileStorageOptions>(configuration);
        var options = configuration.GetRequiredOptions<GridFsFileStorageOptions>();

        services.AddSingleton(CreateBucket(configuration, options));
        services.AddSingleton<IFileService, GridFsFileService>();

        return services;
    }

    public static IServiceCollection AddGridFsFileStorageAsScoped<TOptions>(this IServiceCollection services, IConfiguration configuration)
        where TOptions : GridFsFileStorageOptions
    {
        services.AddAndValidateOptions<TOptions>(configuration);
        var options = configuration.GetRequiredOptions<TOptions>();

        services.AddScoped<IFileService<TOptions>>(_ => new GridFsFileService<TOptions>(CreateBucket(configuration, options)));

        return services;
    }

    private static GridFSBucket CreateBucket(IConfiguration configuration, GridFsFileStorageOptions options)
    {
        var connectionString = configuration.GetRequiredConnectionString(options.ConnectionStringName);
        var database = new MongoClient(connectionString).GetDatabase(options.DatabaseName);

        return new GridFSBucket(database, new GridFSBucketOptions
        {
            BucketName = options.BucketName,
            ChunkSizeBytes = options.ChunkSizeBytes,
            WriteConcern = WriteConcern.WMajority,
            ReadPreference = ReadPreference.Primary
        });
    }
}
```

The scoped registration builds its provider in a lambda because each marker needs its own bucket — the
per-marker exception the registration rule names (`service-registration` § Registration Patterns). `GridFsFileService` and `GridFsFileService<TOptions>` implement the contract over
the bucket inside the module; their GridFS calls never leave it.

## 4. Upload handler with compensating delete

The mediator style; a FastEndpoints endpoint has the same body in `HandleAsync`.

```csharp file=UploadOrderDocumentCommandHandler.cs
public class UploadOrderDocumentCommandHandler(OrderRepository _orderRepository, IFileService _fileService)
    : IRequestHandler<UploadOrderDocumentCommand, IdResponse>
{
    public async Task<IdResponse> Handle(UploadOrderDocumentCommand command, CancellationToken ct)
    {
        var order = await _orderRepository.GetByIdOrThrowAsync(command.OrderId, ct);

        await using var stream = command.File.OpenReadStream();
        var file = await _fileService.UploadAsync(
            new FileUploadRequest($"orders/{order.Id}/{command.File.FileName}", command.File.FileName, command.File.ContentType, command.File.Length),
            stream,
            overwrite: true,
            ct: ct);

        try
        {
            order.AddDocument(command.Kind, file.FileId, command);
            await _orderRepository.SaveChangesAsync(ct);
        }
        catch
        {
            await _fileService.TryDeleteAsync(file.FileId, ct);
            throw;
        }

        return new IdResponse(order.Id);
    }
}
```

## 5. Runtime factory (only when the store is chosen per call)

```csharp file=FileStorageType.cs
public enum FileStorageType
{
    Own,
    Ordering
}
```

```csharp file=FileServiceFactory.cs
public delegate IFileService FileServiceFactory(FileStorageType fileStorageType);
```

The factory is a delegate registered once (`add-state-machine` § Phase 3 — Factory delegate DI registration has the
rule). The own arm resolves the plain `IFileService` — the singleton of Phase 3 — and each foreign arm its marker:

```csharp
services.AddScoped<FileServiceFactory>(provider => fileStorageType => fileStorageType switch
{
    FileStorageType.Ordering => provider.GetRequiredService<IFileService<OrderingFileStorageOptions>>(),
    _ => provider.GetRequiredService<IFileService>()
});
```

## 6. Both stores together — the cross-stage copy

A consumer that always reads the foreign store and writes its own injects both directly; its sample is
`consumer-patterns` (`../../consumer-patterns/references/write-side-consumer.md`).
