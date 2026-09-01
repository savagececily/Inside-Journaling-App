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
- Authenticate to Azure services with Managed Identity. Do not add connection strings or API keys for Azure resources.
- Do not use the `AzureBlobStorage__` prefix for App Service settings; Azure rejects it. Use `BlobStorage__`.
- All AI features use the Azure AI Foundry endpoint (`inside-journaling-app-foundry`).

## Documentation

- Do not create new markdown files to summarize or document changes unless explicitly asked.
- Keep documentation links pointing at files that actually exist in the repository.
