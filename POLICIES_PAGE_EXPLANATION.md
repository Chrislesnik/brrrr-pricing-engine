# Organization Policies Page - Functionality Explanation

## Purpose

The **Access Policies** page (`/org/[orgId]/settings/policies`) allows organization owners/admins to define custom access control policies for database tables and storage buckets.

---

## Current Functionality (v1 - Global Scope)

### **What You Can Configure:**

#### 1. **Resource Scope** 
- **All tables**: Applies policy to every table in the database
- **All storage buckets**: Applies policy to every storage bucket
- **Note**: Currently uses `resource_name = "*"` (wildcard)
- **Future (v2)**: Will support specific table/bucket names

#### 2. **Actions** (Multi-select)
Which database operations this policy grants:
- **Select**: Read/query data
- **Insert**: Create new records
- **Update**: Modify existing records
- **Delete**: Remove records

You can select any combination (e.g., "Select + Insert only")

#### 3. **Allow Internal Users** (Global Bypass)
- **Switch ON**: Internal users bypass all rules (full access)
- **Switch OFF**: Internal users follow the same rules as everyone else
- Checks `users.is_internal_yn = true`

#### 4. **Allow Rules** (OR Logic)
Define who gets access based on role combinations.

**Each rule is an AND of 3 conditions:**
1. **Organization Type**: Any / Internal only / External only
   - Checks `organizations.is_internal_yn`
   - "Any" = doesn't matter
   - "Internal only" = only if org.is_internal_yn = true
   - "External only" = only if org.is_internal_yn = false

2. **Organization Role**: Owner / Admin / Member / Broker / Any
   - Clerk organization role
   - From `organization_members.clerk_org_role`

3. **Member Role**: Admin / Manager / Member / Any
   - Custom member-level role
   - From `organization_members.clerk_member_role`

**Multiple rules are OR'd together:**
- Rule 1: (Internal + Owner + Any member) **OR**
- Rule 2: (Any org type + Admin + Admin member) **OR**
- Rule 3: (External + Broker + Member)
- etc.

---

## How Policies Work

### **Database Integration:**

Policies are stored in the `org_policies` table with:
- `resource_type`: "table" or "storage_bucket"
- `resource_name`: "*" (wildcard for v1)
- `action`: "select", "insert", "update", "delete", or "all"
- `definition_json`: Raw policy definition
- `compiled_config`: Optimized config with:
  - `allow_internal_users`: boolean
  - `allowed_role_pairs`: array of "orgRole|memberRole" strings
  - `org_type_filter`: "any", "internal", or "external" (NEW!)

### **Enforcement:**

The `can_access_org_resource(resource_type, resource_name, action)` function checks:
1. Service role? → Allow
2. Organization owner? → Allow (prevent lockout)
3. Internal user AND policy.allow_internal_users? → Allow
4. Match any rule where:
   - Organization type matches (if specified)
   - Org role matches (or wildcard *)
   - Member role matches (or wildcard *)

---

## Example Use Cases

### Use Case 1: Internal Admins Get Full Access
```
Resource: All tables
Actions: Select, Insert, Update, Delete
Allow Internal Users: ON
Rules: (none needed - internal bypass covers it)
```

### Use Case 2: External Brokers Can View Only
```
Resource: All tables
Actions: Select
Allow Internal Users: OFF
Rules:
  - External org + Broker + Any member role
```

### Use Case 3: Internal Owners or Any Admin
```
Resource: All storage buckets
Actions: Select, Insert
Allow Internal Users: OFF
Rules:
  - Internal org + Owner + Any member
  - Any org + Admin + Admin member
```

---

## Limitations (v1)

### **Current Limitations:**
1. ⚠️ **No specific table/bucket selection**
   - Can only do "all tables" or "all buckets"
   - Cannot target specific tables like "deals" or buckets like "documents"
   - Fixed by setting resource_name to specific name instead of "*"

2. ⚠️ **No row-level filters**
   - Cannot filter by deal ownership, team membership, etc.
   - Applies to ALL rows in the table

3. ⚠️ **No field-level visibility**
   - Cannot hide specific columns from certain roles
   - All-or-nothing access to table

### **Planned for v2:**
- Specific table/bucket selection dropdown
- Row-level filter conditions (WHERE clauses)
- Field-level visibility rules
- More complex condition logic (nested AND/OR)

---

## Architecture

### **Database Schema:**

```sql
CREATE TABLE public.org_policies (
  id uuid PRIMARY KEY,
  org_id uuid REFERENCES organizations(id),
  resource_type text CHECK (resource_type IN ('table', 'storage_bucket')),
  resource_name text DEFAULT '*',
  action text CHECK (action IN ('select', 'insert', 'update', 'delete', 'all')),
  definition_json jsonb,
  compiled_config jsonb,
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

### **RLS Enforcement:**

Migration `20260203154000_org_policy_rls_generator.sql` dynamically creates policies on all public tables:

```sql
CREATE POLICY org_policy_select
  ON public.some_table
  FOR SELECT
  TO authenticated
  USING (can_access_org_resource('table', 'some_table', 'select'));
```

The function checks the `org_policies` table for matching policies.

---

## Current Enhancement: Organization Type Filter

**NEW in this commit:**

Each rule now includes Organization Type as a third condition:
- **Organization Type** (new!) + Organization Role + Member Role
- 3-way AND condition per rule
- Rules still OR'd together

This allows policies like:
- "Internal organizations with Owner role" 
- "External organizations with Broker + Member roles"
- "Any organization with Admin + Admin"

---

## Testing

To test a policy:
1. Create a policy with specific rules
2. Try accessing a resource as different user types
3. Check if access is granted/denied correctly
4. Review RLS policy execution in Supabase logs

---

## Future Roadmap

**v2 Features:**
- [ ] Specific table/bucket selection
- [ ] Row-level filters (WHERE conditions)
- [ ] Field-level visibility rules
- [ ] Policy templates/presets
- [ ] Bulk policy management
- [ ] Policy testing/simulation tool
- [ ] Audit logs for policy changes
