using System.Text;
using System.Threading.RateLimiting;
using CasaDiAna.API.Middleware;
using CasaDiAna.Domain.Entities;
using CasaDiAna.Domain.Enums;
using CasaDiAna.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using CasaDiAna.Application.Common;
using CasaDiAna.Infrastructure;
using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

// Npgsql 6+: permite DateTime com Kind=Unspecified em colunas timestamptz
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Infraestrutura (EF Core, repositórios, JwtService)
builder.Services.AddInfrastructure(builder.Configuration);

// MediatR — registra todos os handlers da camada Application
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(
        typeof(ValidationBehavior<,>).Assembly));

// Pipeline de validação: valida o comando antes de executar o handler
builder.Services.AddTransient(
    typeof(IPipelineBehavior<,>),
    typeof(ValidationBehavior<,>));

// FluentValidation — registra todos os validators da camada Application
builder.Services.AddValidatorsFromAssembly(
    typeof(ValidationBehavior<,>).Assembly);

// JWT
var jwtChave = builder.Configuration["Jwt:Chave"]
    ?? throw new InvalidOperationException("Jwt:Chave não configurada.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Emissor"],
            ValidAudience = builder.Configuration["Jwt:Emissor"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtChave))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(opt =>
        opt.SuppressModelStateInvalidFilter = true);

// Rate limiting — protege o endpoint de login contra brute force
// Máximo de 10 tentativas por minuto por IP
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("login", opt =>
    {
        opt.PermitLimit = 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

// Swagger com autenticação JWT
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Casa di Ana – API",
        Version = "v1",
        Description = "Sistema de Gestão Operacional"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Informe o token JWT. Exemplo: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS — origens configuráveis via env var CorsOrigins (vírgula separada)
// Headers e métodos restritos ao necessário para o frontend
var corsOrigins = (builder.Configuration["CorsOrigins"] ?? "http://localhost:5173")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p =>
        p.WithOrigins(corsOrigins)
         .WithHeaders("Authorization", "Content-Type", "Accept")
         .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")));

var app = builder.Build();

// Aplica migrations e seed na inicialização
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (!db.Usuarios.Any())
    {
        var admin = Usuario.Criar(
            "Admin",
            "admin@casadiana.com",
            Usuario.HashSenha("Admin@123"),
            PapelUsuario.Admin);
        db.Usuarios.Add(admin);
        db.SaveChanges();
    }
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Swagger: habilitado em desenvolvimento ou se Swagger:Habilitado=true nas env vars
// Para habilitar em produção no Render: adicione Swagger__Habilitado=true nas env vars
var swaggerHabilitado = !app.Environment.IsProduction()
    || builder.Configuration.GetValue<bool>("Swagger:Habilitado");

if (swaggerHabilitado)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Casa di Ana v1"));
}

// Security headers — proteção contra ataques comuns de browser
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    await next();
});

app.UseRateLimiter();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
