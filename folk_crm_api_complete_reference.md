# Folk CRM API -- Complete Reference

**Research Date:** 2026-02-06
**API Version:** 2025-05-26 (date-based versioning)
**Base URL:** `https://api.folk.app`
**Protocol:** HTTPS only (HTTP requests will fail)
**Spec Compliance:** Standard Webhooks specification

---

## Table of Contents

1. [Authentication](#authentication)
2. [Versioning](#versioning)
3. [Rate Limits](#rate-limits)
4. [Pagination](#pagination)
5. [Filtering](#filtering)
6. [Error Handling](#error-handling)
7. [People (Contacts)](#people-contacts)
8. [Companies](#companies)
9. [Groups](#groups)
10. [Deals](#deals)
11. [Notes](#notes)
12. [Reminders](#reminders)
13. [Interactions](#interactions)
14. [Users](#users)
15. [Webhooks](#webhooks)
16. [Custom Fields](#custom-fields)
17. [Changelog Highlights](#changelog-highlights)
18. [Roadmap](#roadmap)
19. [Limitations and Notable Features](#limitations-and-notable-features)

---

## Authentication

- **Method:** Bearer token authentication
- **Header:** `Authorization: Bearer <your-api-key>`
- **Key Management:** Generate and manage API keys in workspace settings under the "API" section
- **Failure Response:** `401 Unauthorized` for missing or invalid keys
- **Scope:** Currently no granular scopes (planned for future -- read, write, read+write)

---

## Versioning

- **Current Version:** `2025-05-26`
- **Header:** `X-API-Version: 2025-05-26`
- **Default Behavior:** Defaults to latest version if header is omitted
- **Invalid Version:** Returns `400 Bad Request`
- **Strategy:** New versions introduced only for breaking changes
- **Best Practice:** Always include the version header to avoid unintended behavior changes

---

## Rate Limits

- **Limit:** 600 requests per minute (uniform across all endpoints)
- **Scope:** Per-user (multiple API keys for the same user share the limit)
- **Response Headers:**
  - `X-RateLimit-Limit` -- max requests per minute
  - `X-RateLimit-Remaining` -- requests left in current window
  - `X-RateLimit-Reset` -- epoch timestamp when limit resets
- **When Exceeded:** `429` status with `Retry-After` header (seconds to wait)
- **Recommended Strategy:** Exponential backoff with jitter

---

## Pagination

- **Type:** Cursor-based (opaque tokens)
- **Parameters:**
  - `limit` -- items per page (default: 20, max: 100, min: 1)
  - `cursor` -- opaque pagination token (max 128 chars)
- **Response Structure:**
  ```json
  {
    "data": {
      "items": [...],
      "pagination": {
        "nextLink": "https://api.folk.app/v1/...?cursor=..."
      }
    }
  }
  ```
- **End of Results:** `pagination.nextLink` is omitted when no more pages exist
- **Usage:** Either follow `nextLink` directly or extract the cursor parameter

---

## Filtering

- **Syntax:** `?filter[<field>][<operator>]=<value>`
- **Combinators:** `?combinator=and` (default) or `?combinator=or`

### Operators

| Operator | Description | Applicable Types |
|----------|-------------|------------------|
| `eq` | Equals | Text, numbers, dates |
| `not_eq` | Not equals | Text, numbers, dates |
| `gt` | Greater than | Numbers, dates |
| `lt` | Less than | Numbers, dates |
| `like` | Contains (pattern match) | Text only |
| `not_like` | Does not contain | Text only |
| `empty` | Is null/empty | All fields |
| `not_empty` | Is not null/empty | All fields |
| `in` | In list | Reference fields |
| `not_in` | Not in list | Reference fields |
| `all` | Matches all values | Multi-reference fields |

### Filterable Fields by Resource

**People:** fullName, firstName, lastName, jobTitle, birthday, description, emails, phones, addresses, urls, companies, groups, createdAt, createdBy, plus custom fields

**Companies:** name, description, emails, phones, addresses, urls, groups, createdAt, createdBy, fundingRaised, lastFundingDate, foundationYear, industry, employeeRange, plus custom fields

**Deals:** name, people, companies, createdAt, createdBy, plus custom fields

### Custom Field Filtering
- Pattern: `filter[customFieldValues.{groupId}.{fieldName}][operator]=value`
- Reference fields support sub-selectors: `[id]` or `[email]`

---

## Error Handling

### Response Structure
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "documentationUrl": "https://...",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "requestId": "req_...",
  "details": {}
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `INVALID_REQUEST` | Malformed or invalid request |
| 401 | `UNAUTHORIZED` | Invalid or missing API key |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `RESOURCE_NOT_FOUND` | Resource does not exist |
| 422 | `UNPROCESSABLE_ENTITY` | Validation errors (includes Zod-style `issues` array) |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests (includes `limit`, `remaining`, `retryAfter`) |
| 500 | `INTERNAL_SERVER_ERROR` | Server-side failure |
| 503 | `SERVICE_UNAVAILABLE` | Temporary maintenance |

### Request ID
- Header: `X-Request-Id` on every response
- Also in error response body as `requestId`
- Provide to support for debugging

---

## People (Contacts)

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (40 chars) | Unique identifier (prefix: `per_`) |
| `firstName` | string (max 500) | Given name |
| `lastName` | string (max 500) | Family name |
| `fullName` | string (max 1000) | Complete name |
| `description` | string (max 5000) | Bio / summary |
| `birthday` | string or null | ISO date (YYYY-MM-DD) |
| `jobTitle` | string (max 500) | Professional role |
| `createdAt` | string or null | ISO datetime |
| `createdBy` | User object | Creator {id, fullName, email} |
| `groups` | array | [{id, name}] |
| `companies` | array | [{id, name}] -- first is primary |
| `addresses` | array of strings | First is primary |
| `emails` | array of strings | First is primary |
| `phones` | array of strings | First is primary |
| `urls` | array of strings | First is primary |
| `customFieldValues` | object | Keyed by group ID |
| `interactionMetadata` | object | Engagement statistics |
| `strongestConnection` | object | Primary contact per group |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/people` | List people (paginated, filterable) |
| GET | `/v1/people/{personId}` | Get a single person |
| POST | `/v1/people` | Create a person |
| PATCH | `/v1/people/{personId}` | Update a person (partial) |
| DELETE | `/v1/people/{personId}` | Delete a person (permanent, irreversible) |

### Create/Update Constraints
- `groups`: max 100 items
- `companies`: max 20 items (by name or ID)
- `emails`, `phones`, `addresses`, `urls`: max 20 items each
- **Update behavior for arrays:** REPLACES old values entirely (not append)
- **Removing from group:** Deletes all custom field values for that group

---

## Companies

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (40 chars) | Unique identifier (prefix: `com_`) |
| `name` | string (max 1000) | Company name (**unique across workspace**) |
| `description` | string (max 5000) | Summary |
| `fundingRaised` | string or null | USD amount |
| `lastFundingDate` | string or null | YYYY-MM-DD |
| `industry` | string or null (max 1000) | Industry sector |
| `foundationYear` | string or null | YYYY format |
| `employeeRange` | string or null | Enum: "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5001-10000", "10000+" |
| `groups` | array | [{id, name}] |
| `addresses` | array of strings | First is primary |
| `emails` | array of strings | First is primary |
| `phones` | array of strings | First is primary |
| `urls` | array of strings | First is primary |
| `createdAt` | string or null | ISO datetime |
| `createdBy` | User object | {id, fullName, email} |
| `customFieldValues` | object | Keyed by group ID |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/companies` | List companies (paginated, filterable) |
| GET | `/v1/companies/{companyId}` | Get a single company |
| POST | `/v1/companies` | Create a company |
| PATCH | `/v1/companies/{companyId}` | Update a company (partial) |
| DELETE | `/v1/companies/{companyId}` | Delete a company (permanent, irreversible) |

### Notable Behaviors
- **Unique names:** Company names are unique across the workspace. Creating a duplicate returns the existing company.
- **Array updates:** REPLACES old values entirely (groups, addresses, emails, phones, urls)
- **Delete cascade:** Removes all custom field values, notes, and associations

---

## Groups

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (40 chars) | Unique identifier (prefix: `grp_`) |
| `name` | string | Group name |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/groups` | List all groups (paginated) |
| GET | `/v1/groups/{groupId}/custom-fields/{entityType}` | List custom fields for a group |

### Custom Fields Endpoint
- `entityType` accepts: `person`, `company`, or custom object names
- Returns field definitions with name, type, options (for select fields), and config (for numeric fields)

**Note:** Groups cannot be created, updated, or deleted via the API -- only listed.

---

## Deals

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (40 chars) | Unique identifier (prefix: `obj_`) |
| `name` | string (max 1000) | Deal name |
| `companies` | array | [{id, name}] |
| `people` | array | [{id, fullName}] |
| `createdAt` | string or null | ISO datetime |
| `createdBy` | User object | {id, fullName, email} |
| `customFieldValues` | object | Field values (not grouped by group ID -- flat) |

### Endpoints

Deals use a group-scoped URL pattern:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/groups/{groupId}/{objectType}` | List deals in a group |
| GET | `/v1/groups/{groupId}/{objectType}/{objectId}` | Get a single deal |
| POST | `/v1/groups/{groupId}/{objectType}` | Create a deal |
| PATCH | `/v1/groups/{groupId}/{objectType}/{objectId}` | Update a deal |
| DELETE | `/v1/groups/{groupId}/{objectType}/{objectId}` | Delete a deal (permanent) |

### Key Details
- `groupId`: The group the deals belong to (40 chars)
- `objectType`: The name of the deal custom field type (max 500 chars, typically "Deals")
- Deals can only reference people and companies from the same group
- **Array updates:** `people` and `companies` arrays REPLACE old values entirely
- **Custom field value types:** string, number, ISO date, single select label, multi-select array, user array, null (to unset)

---

## Notes

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (40 chars) | Unique identifier |
| `entity` | object | {id, entityType (person/company/object), fullName} |
| `content` | string (1-100,000 chars) | Markdown content |
| `visibility` | string | "public" or "private" |
| `author` | object | {type (user/assistant), id, fullName, email, deleted} |
| `createdAt` | string or null | ISO datetime |
| `parentNote` | object or null | Parent note if reply {id, deleted} |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/notes` | List notes (filterable by entity.id) |
| GET | `/v1/notes/{noteId}` | Get a single note |
| POST | `/v1/notes` | Create a note |
| PATCH | `/v1/notes/{noteId}` | Update a note |
| DELETE | `/v1/notes/{noteId}` | Delete a note |

### Content Features
- CommonMark markdown supported (headings, bold, italic, lists, links, images, blockquotes, code)
- User mentions: `[Name](https://api.folk.app/v1/users/<user_id>)`
- External file links via public URLs
- Author can be "user" or "assistant" type

---

## Reminders

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string (max 255) | Reminder name |
| `entity` | object | {id, entityType (person/company/object), fullName} |
| `recurrenceRule` | string (max 150) | iCalendar (RFC 5545) format |
| `visibility` | string | "public" or "private" |
| `assignedUsers` | array | Users notified on trigger (1-50, required for public) |
| `nextTriggerTime` | string or null | ISO datetime |
| `lastTriggerTime` | string or null | ISO datetime |
| `createdBy` | User object | {id, fullName, email} |
| `createdAt` | string or null | ISO datetime |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/reminders` | List reminders (filterable by entity.id) |
| GET | `/v1/reminders/{reminderId}` | Get a single reminder |
| POST | `/v1/reminders` | Create a reminder |
| PATCH | `/v1/reminders/{reminderId}` | Update a reminder |
| DELETE | `/v1/reminders/{reminderId}` | Delete a reminder |

### Recurrence Rule Format
```
DTSTART;TZID=Europe/Paris:20250717T090000
RRULE:FREQ=WEEKLY;INTERVAL=1
```
Supported frequencies: no repeat (`COUNT=1`), every weekday, weekly, bi-weekly, monthly, quarterly, yearly.

---

## Interactions

### Data Model (LoggedInteraction)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `entity` | object | {id, entityType, fullName} |
| `dateTime` | string | ISO 8601 (max 24 chars) |
| `title` | string (max 255) | Interaction title |
| `content` | string (max 100,000) | Multi-line content |
| `type` | string | Interaction type (see below) |

### Single Endpoint

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/interactions` | Create an interaction |

**Note:** This is CREATE-ONLY. There are no list, get, update, or delete endpoints for interactions.

### Interaction Types
- **Predefined:** call, meeting, message, coffee, lunch, event, drink
- **Messaging apps:** whatsapp, twitter, linkedin, hangout, skype, slack, iMessage, fbMessenger, signal, discord, wechat, telegram, viber
- **Custom:** Any emoji (max 50 chars)

---

## Users

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (prefix: `usr_`) |
| `fullName` | string | User's full name |
| `email` | string | User's email address |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/users` | List workspace users (paginated) |
| GET | `/v1/users/me` | Get the current authenticated user |
| GET | `/v1/users/{userId}` | Get a specific user |

**Note:** Users are READ-ONLY via the API. No create, update, or delete operations.

---

## Webhooks

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier |
| `name` | string (max 255) | Friendly name |
| `targetUrl` | string (max 2048) | Publicly accessible HTTP/HTTPS URL |
| `subscribedEvents` | array (1-20) | Event subscriptions with optional filters |
| `signingSecret` | string | HMAC-SHA256 signing key (shown ONCE at creation) |
| `redactedSigningSecret` | string | Masked version (shown in list/get) |
| `status` | string | "active" or "inactive" |
| `createdAt` | string | ISO datetime |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/webhooks` | List webhooks |
| GET | `/v1/webhooks/{webhookId}` | Get a webhook |
| POST | `/v1/webhooks` | Create a webhook |
| PATCH | `/v1/webhooks/{webhookId}` | Update a webhook |
| DELETE | `/v1/webhooks/{webhookId}` | Delete a webhook |

### Supported Event Types

| Category | Events |
|----------|--------|
| Person | `person.created`, `person.updated`, `person.deleted`, `person.groups_updated`, `person.workspace_interaction_metadata_updated` |
| Company | `company.created`, `company.updated`, `company.deleted`, `company.groups_updated` |
| Deal | `object.created`, `object.updated`, `object.deleted` |
| Note | `note.created`, `note.updated`, `note.deleted` |
| Reminder | `reminder.created`, `reminder.updated`, `reminder.deleted`, `reminder.triggered` |

### Event Filters
```json
{
  "eventType": "person.updated",
  "filter": {
    "groupId": "grp_...",
    "objectType": "Deals",
    "path": ["fieldName"],
    "value": "specific-value"
  }
}
```
- Person and company events support filtering on native and custom fields
- Deal events support filtering by name and custom fields only
- Note and reminder events do NOT support filters

### Webhook Delivery Details

**Verification:**
- HMAC-SHA256 symmetric signing
- Signing secret revealed only at creation time (store it securely)
- Headers: `webhook-id`, `webhook-timestamp`, `webhook-signature`

**Retry Policy:**
- Retries for up to 24 hours with exponential backoff
- Schedule: immediate, 5s, 5m, 30m, 2h, 5h, 10h, 14h, 20h, 24h
- Success requires 2xx status code
- 410 Gone triggers immediate deactivation
- High error rates also trigger deactivation

**Response Requirements:**
- Accept POST with JSON payload
- Return 2xx within 20 seconds
- Process asynchronously to avoid timeouts

**Payload Structure:**
- All events include: event ID, event type, timestamp, source URL, data object
- Update events include `changes` array with path, change type (add/remove/set), and values
- Delete events include `details` object with preserved information

**Best Practices:**
- Deduplicate events (log processed IDs for 48+ hours)
- Subscribe only to needed events
- Use message queues for processing
- Exempt webhook routes from CSRF
- Do not assume event ordering

---

## Custom Fields

### Supported Types (9 total)

| Type | Description |
|------|-------------|
| `textField` | Short text entries |
| `numericField` | Numbers with optional currency formatting |
| `dateField` | Calendar dates |
| `singleSelect` | One option from predefined list |
| `multipleSelect` | Multiple options from predefined list |
| `contactField` | References to other workspace contacts |
| `userField` | References to workspace members |
| `magicField` | Auto-generated data based on contact info |
| `objectField` | Links deals to contacts |

### Key Behaviors
- Custom fields are **scoped to individual groups** (same field name can exist independently across groups)
- Field names must be unique within their group
- Unset values appear as `null` in API responses
- Removing a contact from a group **automatically deletes** associated custom field values
- In API responses, custom field values appear in `customFieldValues` keyed by group ID (for people/companies) or flat (for deals)

### Custom Field Definition Model
```json
{
  "name": "Status",
  "type": "singleSelect",
  "options": [
    { "label": "Active", "color": "green" },
    { "label": "Inactive", "color": "red" }
  ],
  "config": {
    "format": "currency",
    "currency": "USD"
  }
}
```

---

## Changelog Highlights

| Date | Change |
|------|--------|
| 2025-10-13 | Added company fields: fundingRaised, lastFundingDate, industry, foundationYear, employeeRange |
| 2025-10-10 | Webhook management endpoints (CRUD) |
| 2025-10-08 | Notes: assistant-authored notes, deleted user support |
| 2025-08-28 | Added createdAt/createdBy across all resources |
| 2025-07-29 | Interaction creation endpoint |
| 2025-07-28 | Notes CRUD endpoints |
| 2025-07-21 | Reminders CRUD endpoints |
| 2025-07-17 | Deals CRUD endpoints |
| 2025-06-11 | Initial API release |

No breaking changes documented. API follows additive development model.

---

## Roadmap

- **API Key Scopes:** Granular permissions (read, write, read+write) in development
- **General:** Incremental feature releases planned; no specific dates published
- Features shaped by developer feedback

---

## Limitations and Notable Features

### Limitations

1. **No group CRUD:** Groups can only be listed, not created/updated/deleted via API
2. **No user management:** Users are read-only
3. **Interactions are create-only:** No list, get, update, or delete for interactions
4. **Array fields replace entirely:** When updating people, companies, or deals, array fields (groups, companies, emails, phones, urls, addresses) completely replace old values -- there is no append operation
5. **No bulk operations:** No batch create/update/delete endpoints
6. **No search endpoint:** Must use filtering on list endpoints instead
7. **Deals are group-scoped:** URL pattern requires groupId and objectType in the path
8. **Webhook signing secret shown once:** Lost secrets require creating a new webhook
9. **No enrichment API:** No endpoint for contact/company data enrichment
10. **No tags endpoint:** Tags appear to be handled via custom fields (multipleSelect)
11. **No pipeline/stage management:** Deal stages are managed via custom fields, not dedicated endpoints
12. **Rate limit is per-user, not per-key:** Multiple API keys for same user share the 600/min limit

### Notable Features

1. **Rich filtering system:** Powerful filter syntax with multiple operators and custom field support
2. **Cursor-based pagination:** Stateless, scalable pagination with opaque cursors
3. **Comprehensive webhooks:** 19 event types with filters, HMAC verification, 24-hour retry with backoff
4. **Markdown notes:** Full CommonMark support with @mentions and file links
5. **Flexible interaction types:** 21+ predefined types plus custom emoji types
6. **iCalendar recurrence:** Reminders use standard RFC 5545 recurrence rules
7. **Company deduplication:** Unique name constraint prevents duplicate companies
8. **Custom field flexibility:** 9 field types including magic (auto-generated) fields
9. **Standard Webhooks spec:** Compliance with standardwebhooks.com conventions
10. **Date-based versioning:** Clear, predictable API version management

---

## Complete Endpoint Summary

| Resource | GET (List) | GET (Single) | POST (Create) | PATCH (Update) | DELETE |
|----------|-----------|--------------|----------------|----------------|--------|
| People | Yes | Yes | Yes | Yes | Yes |
| Companies | Yes | Yes | Yes | Yes | Yes |
| Groups | Yes | -- | -- | -- | -- |
| Group Custom Fields | Yes | -- | -- | -- | -- |
| Deals | Yes | Yes | Yes | Yes | Yes |
| Notes | Yes | Yes | Yes | Yes | Yes |
| Reminders | Yes | Yes | Yes | Yes | Yes |
| Interactions | -- | -- | Yes | -- | -- |
| Users | Yes | Yes | -- | -- | -- |
| Webhooks | Yes | Yes | Yes | Yes | Yes |

**Total unique endpoints: 33**
