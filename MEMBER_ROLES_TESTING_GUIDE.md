# Member Roles System - Testing Guide

## ✅ Database Setup Complete

You've successfully run both SQL scripts:
1. ✅ `UPDATE_MEMBER_ROLES_FOR_HYBRID.sql` - Hybrid system enabled
2. ✅ `SEED_DEFAULT_MEMBER_ROLES.sql` - 5 global roles created

---

## 🧪 **Testing Checklist:**

### **Test 1: View Member Roles**

**Navigate to:**
```
http://localhost:3000/org/org_38MVrtrQBrhnDmbz9w90xrm24uT/settings?tab=member-roles
```

**Expected:**
- ✅ Table shows 5 global roles
- ✅ Each has a "Global" badge
- ✅ Roles listed: Admin, Manager, Member, Account Executive, Loan Processor

---

### **Test 2: Create Org-Specific Role**

**Steps:**
1. Click "Add Role" button
2. Fill in:
   - Role Code: `underwriter`
   - Role Name: `Underwriter`
   - Description: `Reviews and approves loan applications`
   - Global Role: ❌ Leave OFF (org-specific)
   - Active: ✅ ON
3. Click "Create"

**Expected:**
- ✅ Role appears in table
- ✅ NO "Global" badge (it's org-specific)
- ✅ Now you have 6 roles total (5 global + 1 org)

---

### **Test 3: Create Global Role**

**Steps:**
1. Click "Add Role" button
2. Fill in:
   - Role Code: `compliance_officer`
   - Role Name: `Compliance Officer`
   - Description: `Ensures regulatory compliance`
   - Global Role: ✅ Turn ON (global)
   - Active: ✅ ON
3. Click "Create"

**Expected:**
- ✅ Role appears with "Global" badge
- ✅ Available to all organizations

---

### **Test 4: Policy Builder Integration**

**Navigate to:**
```
http://localhost:3000/org/org_38MVrtrQBrhnDmbz9w90xrm24uT/settings/policies
```

**Steps:**
1. Scroll to "Allow rules" section
2. Click on "Member role" dropdown

**Expected:**
- ✅ Shows "Any member role" (wildcard)
- ✅ Shows all 5 global roles (Admin, Manager, Member, Account Executive, Loan Processor)
- ✅ Shows custom global role (Compliance Officer)
- ✅ Shows org-specific role with "(Org)" suffix (Underwriter (Org))

---

### **Test 5: Edit Role**

**Steps:**
1. In Member Roles tab, click pencil icon on a role
2. Change description
3. Click "Update"

**Expected:**
- ✅ Changes save successfully
- ✅ Global roles: Only description and active status can be changed
- ✅ Org roles: Can change everything except role_code

---

### **Test 6: Delete Protection**

**Steps:**
1. Assign an org-specific role to a member
2. Try to delete that role

**Expected:**
- ❌ Error: "Cannot delete role - it is currently assigned to one or more members"
- ✅ Protection prevents orphaned member role assignments

---

## 🎯 **How It Works:**

### **Global Roles:**
```sql
organization_id = NULL
role_code = 'admin'
```
- Available to: ALL organizations
- Created by: Anyone with access
- Managed: In Member Roles tab (but protected from deletion)

### **Org-Specific Roles:**
```sql
organization_id = 'some-uuid'
role_code = 'underwriter'
```
- Available to: Only that specific organization
- Created by: Org admins
- Managed: Fully editable/deletable by that org

### **Combined Display:**
```
Policy Builder Dropdown:
├─ Any member role (wildcard)
├─ Admin (global)
├─ Manager (global)
├─ Member (global)
├─ Account Executive (global)
├─ Loan Processor (global)
├─ Compliance Officer (global - if created)
└─ Underwriter (Org) ← org-specific with suffix
```

---

## 📋 **Common Use Cases:**

### **Use Case 1: Standard Roles Across All Orgs**
Create global roles like:
- admin, manager, member (done!)
- compliance_officer
- risk_analyst

These work for every organization.

### **Use Case 2: Org-Specific Custom Roles**
Each org can add their own:
- Org A: underwriter, portfolio_manager
- Org B: loan_officer, credit_analyst
- Org C: relationship_manager, servicing_specialist

### **Use Case 3: Policy Rules**
Create policies that use either:
- Global role: "Any org with Manager role"
- Org role: "External org with Underwriter (Org) role"

---

## 🚀 **Next Steps:**

1. ✅ Test creating both global and org-specific roles
2. ✅ Verify policy builder shows combined list
3. ✅ Test role assignment to members
4. ✅ Verify delete protection works

Your hybrid member roles system is ready! 🎉
