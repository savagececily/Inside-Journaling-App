
using Journal.Services;
using Journal.Models;
using Azure;
using Azure.Core;
using Microsoft.Extensions.Azure;
using Azure.Identity;
using Azure.AI.TextAnalytics;
using OpenAI;
using Azure.AI.OpenAI;
using Microsoft.Extensions.Configuration;
using Microsoft.Azure.Cosmos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace Journal.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Configure logging
            builder.Logging.AddConsole();
            builder.Logging.AddDebug();
            builder.Logging.SetMinimumLevel(LogLevel.Information);

            var defaultCredential = new DefaultAzureCredential(new DefaultAzureCredentialOptions
            {
                ManagedIdentityClientId = Environment.GetEnvironmentVariable("ManagedIdentityClientId")
            });

            // Configuration is loaded from appsettings.json and environment variables
            // Environment variables in Azure App Service override appsettings.json values
            var config = builder.Configuration;

            // Add Application Insights telemetry with explicit connection string
            var appInsightsConnectionString = config["APPLICATIONINSIGHTS_CONNECTION_STRING"];
            if (!string.IsNullOrEmpty(appInsightsConnectionString))
            {
                builder.Services.AddApplicationInsightsTelemetry(options =>
                {
                    options.ConnectionString = appInsightsConnectionString;
                });
                builder.Logging.AddApplicationInsights(
                    configureTelemetryConfiguration: (config) => config.ConnectionString = appInsightsConnectionString,
                    configureApplicationInsightsLoggerOptions: (options) => { }
                );
                
                // Set Application Insights to capture Information level logs
                builder.Logging.AddFilter<Microsoft.Extensions.Logging.ApplicationInsights.ApplicationInsightsLoggerProvider>
                    ("", LogLevel.Information);
            }
            else
            {
                Console.WriteLine("WARNING: Application Insights connection string not found!");
            }

            // builder.Services.AddLogging();

            // === Azure OpenAI with Managed Identity ===
            builder.Services.AddSingleton(_ =>
            {
                var endpointString = config["AzureOpenAI:Endpoint"] ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is not configured");
                var endpoint = new Uri(endpointString);
                return new AzureOpenAIClient(endpoint, defaultCredential);
            });

            builder.Services.AddAzureClients(clients =>
            {
                // Use Blob Storage with Managed Identity
                var blobServiceUri = config["BlobStorage:ServiceUri"] ?? throw new InvalidOperationException("BlobStorage:ServiceUri is not configured");
                clients.AddBlobServiceClient(new Uri(blobServiceUri))
                    .WithCredential(defaultCredential);
            });

            // === Text Analytics with Managed Identity (uses Foundry Hub) ===
            builder.Services.AddSingleton<TextAnalyticsClient>(serviceProvider =>
            {
                // Use Azure AI Foundry Hub endpoint for Text Analytics
                var foundryEndpoint = config["AzureOpenAI:Endpoint"] ?? throw new InvalidOperationException("AzureOpenAI:Endpoint is not configured");
                return new TextAnalyticsClient(new Uri(foundryEndpoint), defaultCredential);
            });

            // === Cosmos DB with Managed Identity ===
            builder.Services.AddSingleton<CosmosClient>(serviceProvider =>
            {
                var endpoint = config["CosmosDb:Endpoint"] ?? throw new InvalidOperationException("CosmosDb:Endpoint is not configured");
                var cosmosClientOptions = new CosmosClientOptions
                {
                    SerializerOptions = new CosmosSerializationOptions
                    {
                        PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                    }
                };
                return new CosmosClient(endpoint, defaultCredential, cosmosClientOptions);
            });

            // === Configuration ===
            builder.Services.AddOptions<AppSettings>()
            .Bind(builder.Configuration)
            .ValidateDataAnnotations()
            .ValidateOnStart();

            // Add services to the container.
            builder.Services.AddSingleton<IAuditLogService, AuditLogService>();
            builder.Services.AddSingleton<IUserConsentService, UserConsentService>();
            builder.Services.AddScoped<IJournalAnalysisService, JournalAnalysisService>();
            builder.Services.AddSingleton<ISpeechToTextService, SpeechToTextService>();
            builder.Services.AddSingleton<IBlobStorageService, BlobStorageService>();
            builder.Services.AddSingleton<ICosmosDbService, CosmosDbService>();
            builder.Services.AddSingleton<IUserService, UserService>();
            builder.Services.AddSingleton<IDataExportService, DataExportService>();
            builder.Services.AddSingleton<IStreakService, StreakService>();
            
            // === Freemium Model Services ===
            builder.Services.AddSingleton<IQuotaService, QuotaService>();
            builder.Services.AddMemoryCache(options =>
            {
                options.SizeLimit = 1000; // Limit to 1000 cached analysis results
            });
            builder.Services.AddSingleton<AnalysisCacheService>();

            // === Stripe Payment Services ===
            builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("Stripe"));
            builder.Services.AddSingleton<IStripeService, StripeService>();

            // === JWT Authentication ===
            var jwtKey = config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured");
            var jwtIssuer = config["Jwt:Issuer"] ?? "Journal";
            var jwtAudience = config["Jwt:Audience"] ?? "JournalApp";

            // Validate JWT key length for security (minimum 256 bits/32 bytes for HS256)
            var jwtKeyBytes = Encoding.UTF8.GetBytes(jwtKey);
            if (jwtKeyBytes.Length < 32)
            {
                throw new InvalidOperationException("JWT Key must be at least 256 bits (32 bytes) for secure HS256 signing. Please use a longer key.");
            }

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };

                // Allow Easy Auth to bypass JWT Bearer authentication
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        // If Easy Auth has already authenticated the user (via EasyAuthMiddleware),
                        // skip JWT Bearer authentication
                        if (context.HttpContext.User?.Identity?.IsAuthenticated == true)
                        {
                            context.Success();
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            builder.Services.AddAuthorization();

            // === Rate Limiting (Cost Protection) ===
            builder.Services.AddRateLimiting();

            // Add CORS policy for web frontend only
            // Note: Mobile apps don't need CORS - CORS is browser-only security
            var allowedOrigins = (config["Cors:AllowedOrigins"] ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            if (allowedOrigins.Length == 0)
            {
                allowedOrigins = new[]
                {
                    "http://localhost:54551",
                    "http://localhost:5173",
                    "https://localhost:54551",
                    "https://localhost:5173"
                };
            }

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowFrontend", policy =>
                {
                    policy.WithOrigins(allowedOrigins)
                    .AllowAnyMethod()
                    .AllowAnyHeader()
                    .AllowCredentials();
                });
            });

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var app = builder.Build();

            var logger = app.Services.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("======================================");
            logger.LogInformation("Inside Journaling App Starting");
            logger.LogInformation("Environment: {Environment}", app.Environment.EnvironmentName);
            
            var appInsightsConnString = config["APPLICATIONINSIGHTS_CONNECTION_STRING"];
            logger.LogInformation("Application Insights: {Status}", 
                string.IsNullOrEmpty(appInsightsConnString) ? "NOT CONFIGURED" : "CONFIGURED");
            
            // Send a test telemetry event
            if (!string.IsNullOrEmpty(appInsightsConnString))
            {
                logger.LogInformation("Application Insights telemetry is enabled");
            }
            logger.LogInformation("======================================");

            app.UseDefaultFiles();
            app.UseStaticFiles();

            // Configure the HTTP request pipeline.
            app.UseSwagger();
            app.UseSwaggerUI();

            // Only use HTTPS redirection in development
            if (app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.UseCors("AllowFrontend");

            // Easy Auth middleware (for Azure App Service Authentication)
            app.UseMiddleware<EasyAuthMiddleware>();

            app.UseAuthentication();
            app.UseAuthorization();
            app.UseRateLimiter(); // Cost protection

            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            logger.LogInformation("Application started successfully");
            
            app.Run();
        }
    }
}
