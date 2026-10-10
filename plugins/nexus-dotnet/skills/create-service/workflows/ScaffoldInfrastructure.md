# Scaffold Infrastructure

Wire the service into the repo: the solution file, the Dockerfile, the compose entry. After this step the solution
compiles and the service can be started.

## Step 1: Add the projects to the solution

```bash
dotnet sln src/{SolutionFile} add \
  src/Services/{Name}/{Name}.Domain/{Name}.Domain.csproj \
  src/Services/{Name}/{Name}.Persistence/{Name}.Persistence.csproj \
  src/Services/{Name}/{Name}.API/{Name}.API.csproj
```

Add the Application project where one was scaffolded. Use `--solution-folder Services/{Name}` where the solution
groups services in folders (read `{SolutionFile}` first).

## Step 2: The Dockerfile (Docker on)

`src/Services/{Name}/{Name}.API/Dockerfile`, on the current .NET images:

```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Directory.Packages.props", "./"]
COPY ["Services/{Name}/{Name}.API/{Name}.API.csproj", "Services/{Name}/{Name}.API/"]
COPY ["Services/{Name}/{Name}.Persistence/{Name}.Persistence.csproj", "Services/{Name}/{Name}.Persistence/"]
COPY ["Services/{Name}/{Name}.Domain/{Name}.Domain.csproj", "Services/{Name}/{Name}.Domain/"]
RUN dotnet restore "./Services/{Name}/{Name}.API/{Name}.API.csproj"
COPY . .
WORKDIR "/src/Services/{Name}/{Name}.API"
RUN dotnet publish "./{Name}.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "{Name}.API.dll"]
```

Copy the project file of every project the service references — its Application project, each shared or contracts
project — before the restore; a missing one fails the restore inside the container.

## Step 3: The compose entry (Docker on)

```yaml
  {name}.api:
    image: ${DOCKER_REGISTRY-}{name}api
    build:
      context: .
      dockerfile: Services/{Name}/{Name}.API/Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_HTTP_PORTS=8080
      - ConnectionStrings__{Name}=...
    ports:
      - "{http-port}:8080"
    depends_on:
      - {database-container}
```

`depends_on`: the database container by the database axis; `rabbitmq` with integration events. Reuse the shared
database container with a database of the service's own; never a new container per service.

## Step 4: Final build

```bash
dotnet build src/{SolutionFile}
```

Zero errors and no new warnings. Then run the searches of the skill's § Verify.

## Not scaffolded

The API gateway route — leave a note in the report when external clients must reach the service.
