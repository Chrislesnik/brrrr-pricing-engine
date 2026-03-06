# API Documentation Standards

Reference document for the team. Formalizes conventions for API documentation to prevent inconsistency as the API surface grows.

---

## Quick Reference

| Convention | Rule |
| --- | --- |
| **operationId** | camelCase, stable for SDK generation |
| **summary** | Imperative mood: "List deals" |
| **tags** | Lowercase kebab-case: `deals`, `loans`, `borrowers` |
| **UUIDs** | `xxx_01HXYZ...` format |
| **Dates** | ISO 8601: `2026-03-05T14:30:00Z` |
| **Currency** | Numbers: `450000.00` |
| **Percentages** | Decimals: `0.075` (not `7.5`) |
| **Scopes** | `read:{resource}` or `write:{resource}` |
| **list** | `listDeals` (GET returning array) |
| **get** | `getScenario` (GET single resource) |
| **create** | `createDeal` (POST) |
| **update** | `updateLoan` (PATCH/PUT) |
| **archive** | `archiveLoan` (soft-delete DELETE) |
| **search** | `searchBorrowers` (GET with `q` param) |

---

## 1. Endpoint Documentation Requirements

Every new API endpoint must include:

- **operationId** — camelCase, stable for SDK generation
- **summary** — One sentence, imperative mood: "List deals", not "Lists deals" or "Returns a list of deals"
- **description** — One paragraph: what it does, when to use it, any gotchas
- **Request example** — At least one for POST/PATCH/PUT
- **Success response example** — At least one
- **Error response examples** — 401, 403, 422 (validation), 404 (single-resource GETs)
- **tags** — Lowercase kebab-case
- **security** — `bearerAuth` scheme

---

## 2. Example Payload Standards

- **Realistic data** — No "string", "test", or "foo"
- **UUIDs** — Use `xxx_01HXYZ...` format for readability:
  - `deal_01HX8K9M2N3P4Q5R6S7T`
  - `loan_01HX8K9M2N3P4Q5R6S7T`
- **Required fields** — Include all
- **Optional fields** — Demonstrate at least one common optional field
- **Dates** — ISO 8601: `2026-03-05T14:30:00Z`
- **Currency** — Numbers, not strings: `450000.00`
- **Percentages** — Decimals: `0.075` (not `7.5`)

### Example

```json
{
  "id": "deal_01HX8K9M2N3P4Q5R6S7T",
  "heading": "123 Main St – Purchase",
  "purchase_price": 450000.00,
  "interest_rate": 0.075,
  "created_at": "2026-03-05T14:30:00Z"
}
```

---

## 3. OperationId Naming Rules

| Pattern | Use Case | Example |
| --- | --- | --- |
| `list{Resource}` | GET returning array | `listDeals`, `listLoans` |
| `get{Resource}` | GET returning single resource | `getScenario`, `getDeal` |
| `create{Resource}` | POST creating resource | `createDeal`, `createBorrower` |
| `update{Resource}` | PATCH/PUT | `updateLoan`, `updateAppraisalOrder` |
| `archive{Resource}` | Soft-delete DELETE | `archiveLoan`, `archiveScenario` — **not** `delete` |
| `search{Resource}` | GET with `q` query param | `searchBorrowers`, `searchEntities` |

**Rules:**

- Never pluralize the resource in compound names: `listDeals` (not `listDealsList`)
- Use singular resource name in the compound: `listDeals`, `getDeal`

---

## 4. Tag Naming Rules

- **Format** — Lowercase kebab-case: `deals`, `loans`, `borrowers`, `entities`, `credit-reports`
- **Singular or plural** — Match the resource collection name
- **New tags** — Require team review to prevent proliferation

### Approved Tags

`deals`, `loans`, `applications`, `borrowers`, `entities`, `scenarios`, `programs`, `appraisals`, `documents`, `credit-reports`, `background-reports`, `pipeline`, `signature-requests`

---

## 5. Schema Naming Rules

| Type | Convention | Example |
| --- | --- | --- |
| **Request schemas** | `Create{Resource}Request`, `Update{Resource}Request`, `Search{Resource}Query`, `List{Resource}Query` | `CreateDealRequest`, `UpdateLoanRequest` |
| **Response schemas** | `{Resource}` (single), `{Resource}Response` (if wrapping), `Paginated{Resource}Response` | `Deal`, `PaginatedDealResponse` |
| **Error schemas** | `ErrorResponse`, `ValidationErrorResponse` | — |
| **Shared schemas** | `PaginationParams`, `TimestampFields`, `IdParam` | — |
| **Enum schemas** | `{Resource}{Field}Enum` | `EntityTypeEnum`, `LoanStatusEnum` |

- **PascalCase** always

---

## 6. Docs Writing Guidelines

### Voice and Tense

- **Active voice, second person** — "You can list deals by..." not "Deals can be listed by..."
- **Present tense** — "Returns a list" not "Will return a list"

### Code Examples

- **Primary** — TypeScript
- **Secondary** — curl

### Content

- No marketing language in API docs
- Every guide has a **Prerequisites** section listing required API scopes

### Mintlify Components

- `<Note>` — Important info
- `<Warning>` — Destructive operations
- `<Tip>` — Best practices

### Linking

- Link to related endpoints from guide content
- Include rate limit info on every endpoint that has specific limits

---

## 7. Scope Naming Convention

| Format | Example |
| --- | --- |
| `read:{resource}` | `read:deals`, `read:loans` |
| `write:{resource}` | `write:deals`, `write:loans` |

- **Resources** match tag names
- **`write`** scope implies `read` access
- **Document** required scope on every endpoint
