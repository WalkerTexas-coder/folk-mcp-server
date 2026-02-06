import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FolkClient } from "./folk-client.js";

const apiKey = process.env.FOLK_API_KEY;
if (!apiKey) {
  console.error("FOLK_API_KEY environment variable is required");
  process.exit(1);
}

const folk = new FolkClient(apiKey);

const server = new McpServer({
  name: "folk-mcp-server",
  version: "1.0.0",
});

// Helper to format tool results
function ok(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function err(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

// ============================================================
// PEOPLE TOOLS
// ============================================================

server.tool(
  "list_people",
  "List people (contacts) in Folk CRM. Supports pagination.",
  {
    limit: z.string().optional().describe("Items per page (1-100, default 20)"),
    cursor: z.string().optional().describe("Pagination cursor from previous response"),
  },
  async ({ limit, cursor }) => {
    try {
      const result = await folk.listPeople({ limit, cursor });
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_person",
  "Get a single person (contact) by ID from Folk CRM.",
  {
    personId: z.string().describe("Person ID (e.g. per_...)"),
  },
  async ({ personId }) => {
    try {
      const result = await folk.getPerson(personId);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_person",
  "Create a new person (contact) in Folk CRM.",
  {
    firstName: z.string().optional().describe("First name (max 500 chars)"),
    lastName: z.string().optional().describe("Last name (max 500 chars)"),
    fullName: z.string().optional().describe("Full name (max 1000 chars)"),
    jobTitle: z.string().optional().describe("Job title (max 500 chars)"),
    description: z.string().optional().describe("Bio/summary (max 5000 chars)"),
    birthday: z.string().optional().describe("Birthday in YYYY-MM-DD format"),
    emails: z.array(z.string()).optional().describe("Email addresses (max 20, first is primary)"),
    phones: z.array(z.string()).optional().describe("Phone numbers (max 20, first is primary)"),
    addresses: z.array(z.string()).optional().describe("Addresses (max 20, first is primary)"),
    urls: z.array(z.string()).optional().describe("URLs (max 20, first is primary)"),
    groups: z.array(z.object({ id: z.string() })).optional().describe("Groups to add to (max 100, by ID)"),
    companies: z.array(z.union([z.object({ id: z.string() }), z.object({ name: z.string() })])).optional().describe("Companies (max 20, by ID or name)"),
  },
  async (params) => {
    try {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) data[key] = value;
      }
      const result = await folk.createPerson(data);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_person",
  "Update an existing person in Folk CRM. Arrays (emails, phones, groups, etc.) REPLACE existing values entirely.",
  {
    personId: z.string().describe("Person ID to update (e.g. per_...)"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    fullName: z.string().optional(),
    jobTitle: z.string().optional(),
    description: z.string().optional(),
    birthday: z.string().optional().describe("YYYY-MM-DD format"),
    emails: z.array(z.string()).optional(),
    phones: z.array(z.string()).optional(),
    addresses: z.array(z.string()).optional(),
    urls: z.array(z.string()).optional(),
    groups: z.array(z.object({ id: z.string() })).optional(),
    companies: z.array(z.union([z.object({ id: z.string() }), z.object({ name: z.string() })])).optional(),
  },
  async ({ personId, ...fields }) => {
    try {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) data[key] = value;
      }
      const result = await folk.updatePerson(personId, data);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_person",
  "Permanently delete a person from Folk CRM. This is irreversible.",
  {
    personId: z.string().describe("Person ID to delete (e.g. per_...)"),
  },
  async ({ personId }) => {
    try {
      const result = await folk.deletePerson(personId);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

// ============================================================
// COMPANY TOOLS
// ============================================================

server.tool(
  "list_companies",
  "List companies in Folk CRM. Supports pagination and filtering by region or custom fields.",
  {
    limit: z.string().optional().describe("Items per page (1-100, default 20)"),
    cursor: z.string().optional().describe("Pagination cursor from previous response"),
    groupId: z.string().optional().describe("Group ID for custom field filtering (e.g. grp_...). Required when using region filter."),
    region: z.string().optional().describe("Filter by Region custom field (e.g. 'Austin', 'Chicago Area'). Requires groupId."),
  },
  async ({ limit, cursor, groupId, region }) => {
    try {
      const result = await folk.listCompanies({ limit, cursor, groupId, region });
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_company",
  "Get a single company by ID from Folk CRM.",
  {
    companyId: z.string().describe("Company ID (e.g. com_...)"),
  },
  async ({ companyId }) => {
    try {
      const result = await folk.getCompany(companyId);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_company",
  "Create a new company in Folk CRM. Company names must be unique across the workspace.",
  {
    name: z.string().describe("Company name (required, unique across workspace, max 1000 chars)"),
    description: z.string().optional().describe("Summary (max 5000 chars)"),
    industry: z.string().optional().describe("Industry sector"),
    employeeRange: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"]).optional().describe("Employee count range"),
    foundationYear: z.string().optional().describe("Year founded (YYYY)"),
    emails: z.array(z.string()).optional().describe("Email addresses (max 20)"),
    phones: z.array(z.string()).optional().describe("Phone numbers (max 20)"),
    addresses: z.array(z.string()).optional().describe("Addresses (max 20)"),
    urls: z.array(z.string()).optional().describe("URLs (max 20)"),
    groups: z.array(z.object({ id: z.string() })).optional().describe("Groups (max 100)"),
  },
  async (params) => {
    try {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) data[key] = value;
      }
      const result = await folk.createCompany(data);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_company",
  "Update an existing company in Folk CRM. Arrays REPLACE existing values entirely.",
  {
    companyId: z.string().describe("Company ID to update (e.g. com_...)"),
    name: z.string().optional(),
    description: z.string().optional(),
    industry: z.string().optional(),
    employeeRange: z.enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+"]).optional(),
    foundationYear: z.string().optional(),
    emails: z.array(z.string()).optional(),
    phones: z.array(z.string()).optional(),
    addresses: z.array(z.string()).optional(),
    urls: z.array(z.string()).optional(),
    groups: z.array(z.object({ id: z.string() })).optional(),
    customFieldValues: z.record(z.record(z.unknown())).optional().describe("Custom field values keyed by group ID, e.g. { 'grp_...': { 'Region': 'Austin' } }"),
  },
  async ({ companyId, ...fields }) => {
    try {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) data[key] = value;
      }
      const result = await folk.updateCompany(companyId, data);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_company",
  "Permanently delete a company from Folk CRM. This is irreversible and removes all associated custom field values, notes, and associations.",
  {
    companyId: z.string().describe("Company ID to delete (e.g. com_...)"),
  },
  async ({ companyId }) => {
    try {
      const result = await folk.deleteCompany(companyId);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

// ============================================================
// DEAL TOOLS (group-scoped)
// ============================================================

server.tool(
  "list_deals",
  "List deals in a Folk CRM group. Deals are scoped to a group and object type.",
  {
    groupId: z.string().describe("Group ID (e.g. grp_...)"),
    objectType: z.string().describe("Object type name (e.g. 'Deals')"),
    limit: z.string().optional().describe("Items per page (1-100, default 20)"),
    cursor: z.string().optional().describe("Pagination cursor"),
  },
  async ({ groupId, objectType, limit, cursor }) => {
    try {
      const result = await folk.listDeals(groupId, objectType, { limit, cursor });
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_deal",
  "Get a single deal by ID from Folk CRM.",
  {
    groupId: z.string().describe("Group ID (e.g. grp_...)"),
    objectType: z.string().describe("Object type name (e.g. 'Deals')"),
    objectId: z.string().describe("Deal/object ID (e.g. obj_...)"),
  },
  async ({ groupId, objectType, objectId }) => {
    try {
      const result = await folk.getDeal(groupId, objectType, objectId);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "create_deal",
  "Create a new deal in a Folk CRM group.",
  {
    groupId: z.string().describe("Group ID (e.g. grp_...)"),
    objectType: z.string().describe("Object type name (e.g. 'Deals')"),
    name: z.string().describe("Deal name (max 1000 chars)"),
    people: z.array(z.object({ id: z.string() })).optional().describe("Associated people (must be in same group)"),
    companies: z.array(z.object({ id: z.string() })).optional().describe("Associated companies (must be in same group)"),
    customFieldValues: z.record(z.unknown()).optional().describe("Custom field values (flat key-value)"),
  },
  async ({ groupId, objectType, ...fields }) => {
    try {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) data[key] = value;
      }
      const result = await folk.createDeal(groupId, objectType, data);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "update_deal",
  "Update an existing deal in Folk CRM. Arrays REPLACE existing values entirely.",
  {
    groupId: z.string().describe("Group ID (e.g. grp_...)"),
    objectType: z.string().describe("Object type name (e.g. 'Deals')"),
    objectId: z.string().describe("Deal/object ID to update (e.g. obj_...)"),
    name: z.string().optional(),
    people: z.array(z.object({ id: z.string() })).optional(),
    companies: z.array(z.object({ id: z.string() })).optional(),
    customFieldValues: z.record(z.unknown()).optional(),
  },
  async ({ groupId, objectType, objectId, ...fields }) => {
    try {
      const data: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) data[key] = value;
      }
      const result = await folk.updateDeal(groupId, objectType, objectId, data);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "delete_deal",
  "Permanently delete a deal from Folk CRM. This is irreversible.",
  {
    groupId: z.string().describe("Group ID (e.g. grp_...)"),
    objectType: z.string().describe("Object type name (e.g. 'Deals')"),
    objectId: z.string().describe("Deal/object ID to delete (e.g. obj_...)"),
  },
  async ({ groupId, objectType, objectId }) => {
    try {
      const result = await folk.deleteDeal(groupId, objectType, objectId);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

// ============================================================
// GROUP TOOLS (read-only)
// ============================================================

server.tool(
  "list_groups",
  "List all groups in Folk CRM. Groups cannot be created/updated/deleted via API.",
  {
    limit: z.string().optional().describe("Items per page (1-100, default 20)"),
    cursor: z.string().optional().describe("Pagination cursor"),
  },
  async ({ limit, cursor }) => {
    try {
      const result = await folk.listGroups({ limit, cursor });
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

// ============================================================
// USER TOOLS (read-only)
// ============================================================

server.tool(
  "list_users",
  "List workspace users in Folk CRM.",
  {
    limit: z.string().optional().describe("Items per page (1-100, default 20)"),
    cursor: z.string().optional().describe("Pagination cursor"),
  },
  async ({ limit, cursor }) => {
    try {
      const result = await folk.listUsers({ limit, cursor });
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

server.tool(
  "get_current_user",
  "Get the currently authenticated Folk CRM user.",
  {},
  async () => {
    try {
      const result = await folk.getCurrentUser();
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);

// ============================================================
// STDIO TRANSPORT
// ============================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Folk CRM MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
