# Copilot Instructions

## Style

- Do not use emojis anywhere in this repository — not in code, comments, commit messages, log output, console output, shell scripts, or documentation files (`.md`).
- Use plain text markers instead of emoji status indicators. For example, write `Done`, `TODO`, `Warning`, `PASS`, `FAIL` rather than checkmarks, warning signs, or similar symbols.
- Do not add decorative symbols to headings, list items, or table cells.

## Naming

- User-facing product name is "Inside Journaling App".
- Code, projects, files, and folders use the `Journal` prefix (for example `Journal.Server`, `journal.client`).

## Configuration

- Configuration comes from `appsettings.json` and environment variables (App Service application settings). Do not reintroduce Azure App Configuration.
- Authenticate to Azure services with user-assigned managed identity. Do not add connection strings or API keys for Azure resources, and do not enable system-assigned identity.
- Do not use the `AzureBlobStorage__` prefix for App Service settings; Azure rejects it. Use `BlobStorage__`.
- CORS is owned by the application via `Cors__AllowedOrigins`. Do not configure App Service platform CORS (`az webapp cors`); it intercepts before the app and silently overrides the application policy.
- Frontend code must build request URLs from `API_BASE_URL` in `journal.client/src/config/api.ts`. Relative `/api/...` fetches break because the UI and API are separate origins.
- Cosmos database names differ per environment: `inside-journaling-app` (production) and `inside-journaling-app-dev` (development). Read the name from configuration; never hardcode it.
- The Cosmos account has an IP firewall. New App Service outbound IPs must be added or every data call fails with 403.
- `DevAuth` enables test-user sign-in and requires a non-production environment plus `DevAuth__Enabled`. Never enable it on the production slot.
- Keep `Jwt__Key`, `ManagedIdentityClientId`, `Cors__AllowedOrigins`, `ASPNETCORE_ENVIRONMENT`, and `APPLICATIONINSIGHTS_CONNECTION_STRING` as slot settings so they do not follow a swap.
- Do not commit secrets to `appsettings.json`; it ships in the deployment package. Set real values as App Service application settings.
- All AI features use the Azure AI Foundry endpoint (`inside-journaling-app-foundry`).

## Documentation

- Do not create new markdown files to summarize or document changes unless explicitly asked.
- Keep documentation links pointing at files that actually exist in the repository.
