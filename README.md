# folk-mcp-server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for the [Folk CRM](https://www.folk.app) API. Enables AI assistants like Claude to interact with your Folk CRM data — managing people, companies, deals, groups, and users.

## Tools

| Tool | Description |
|------|-------------|
| `list_people` | List contacts with pagination |
| `get_person` | Get a person by ID |
| `create_person` | Create a new contact |
| `update_person` | Update an existing contact |
| `delete_person` | Permanently delete a contact |
| `list_companies` | List companies with pagination |
| `get_company` | Get a company by ID |
| `create_company` | Create a new company |
| `update_company` | Update an existing company |
| `delete_company` | Permanently delete a company |
| `list_deals` | List deals in a group |
| `get_deal` | Get a deal by ID |
| `create_deal` | Create a new deal |
| `update_deal` | Update an existing deal |
| `delete_deal` | Permanently delete a deal |
| `list_groups` | List all groups (read-only) |
| `list_users` | List workspace users |
| `get_current_user` | Get the authenticated user |

## Setup

### Prerequisites

- Node.js 18+
- A [Folk CRM](https://www.folk.app) account with an API key (Settings → API)

### Install

```bash
git clone https://github.com/walkertexas-coder/folk-mcp-server.git
cd folk-mcp-server
npm install
npm run build
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "folk-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/folk-mcp-server/dist/index.js"],
      "env": {
        "FOLK_API_KEY": "your-folk-api-key"
      }
    }
  }
}
```

Then restart Claude Desktop.

## Development

```bash
npm run dev    # Run with tsx (hot reload)
npm run build  # Compile TypeScript
npm start      # Run compiled output
```

## API Reference

This server wraps the [Folk CRM API](https://developer.folk.app/api-reference/overview). See Folk's documentation for details on data models and field constraints.

## License

MIT
