# Create gRPC Contract

Code-first contracts with `protobuf-net.Grpc` — no `.proto` files. Written in the gRPC contracts project,
`{Contracts}/{Owner}/`, one type per file.

## Service Interface

```csharp file=ICustomerDirectory.cs
[ServiceContract]
public interface ICustomerDirectory
{
    [OperationContract]
    ValueTask<GetCustomerReply> GetCustomerAsync(GetCustomerRequest request, CallContext context = default);

    [OperationContract]
    ValueTask<GetCustomerStatusReply> GetCustomerStatusAsync(GetCustomerRequest request, CallContext context = default);
}
```

`ValueTask<T>` and `CallContext context = default` are what `protobuf-net.Grpc` expects. A contract is a protocol,
so `…Service` is a fair name for it as well.

## Request and Reply

A reply is a **nested envelope**: the reply class holds the shape the caller needs, as its own contract class — never
the owner's entity.

```csharp file=GetCustomerRequest.cs
[ProtoContract]
public class GetCustomerRequest
{
    [ProtoMember(1)]
    public int Id { get; set; }
}
```

```csharp file=GetCustomerReply.cs
[ProtoContract]
public class GetCustomerReply
{
    [ProtoMember(1)]
    public CustomerInfo Customer { get; set; } = null!;
}
```

```csharp file=CustomerInfo.cs
[ProtoContract]
public class CustomerInfo
{
    [ProtoMember(1)]
    public int Id { get; set; }

    [ProtoMember(2)]
    public string Name { get; set; } = null!;

    [ProtoMember(3)]
    public string Email { get; set; } = null!;
}
```

```csharp file=GetCustomerStatusReply.cs
[ProtoContract]
public class GetCustomerStatusReply
{
    [ProtoMember(1)]
    public bool IsActive { get; set; }
}
```

## Rules

- **`[ProtoMember(n)]` numbers are unique per class and permanent once shipped** — never renumber or reuse one, or an
  old peer and a new one mis-map fields silently. A new field takes the next free number; a retired field leaves its
  number unused.
- Contract classes have a parameterless constructor and settable members — `protobuf-net` fills them; they are the one
  shape of this kind outside a domain.
- A member that must be given is `= null!`; collections are `List<T>`; each nested class is a `[ProtoContract]` of its
  own file; an enum takes `[ProtoContract]` and `[ProtoEnum]` on its members.
