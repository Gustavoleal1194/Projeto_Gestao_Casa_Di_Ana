# Stage 1: build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Restaurar dependências (cache de camadas)
COPY CasaDiAna.sln .
COPY src/CasaDiAna.Domain/CasaDiAna.Domain.csproj             src/CasaDiAna.Domain/
COPY src/CasaDiAna.Application/CasaDiAna.Application.csproj   src/CasaDiAna.Application/
COPY src/CasaDiAna.Infrastructure/CasaDiAna.Infrastructure.csproj src/CasaDiAna.Infrastructure/
COPY src/CasaDiAna.API/CasaDiAna.API.csproj                   src/CasaDiAna.API/
RUN dotnet restore

COPY src/ src/
RUN dotnet publish src/CasaDiAna.API/CasaDiAna.API.csproj \
    -c Release -o /app/publish --no-restore

# Stage 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "CasaDiAna.API.dll"]
