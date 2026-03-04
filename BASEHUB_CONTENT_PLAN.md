# BaseHub Content Plan

## Summary

This document outlines the content created and planned for both BaseHub repositories.

## ✅ Completed: Developer Documentation (brrrr-pricing-engine-docs)

The following comprehensive developer documentation has been created in the docs repository:

### Documentation Section
1. **Getting Started**
   - Prerequisites
   - Quick start guide (API credentials, SDK installation, client initialization)
   - First scenario creation example
   - Core concepts (scenarios, loan types)
   - Next steps

2. **Authentication**
   - API key generation process
   - Using API keys in requests
   - Security best practices
   - API key permissions
   - Rate limits and headers
   - Authentication error handling (401, 403, 429)

3. **Webhooks**
   - Overview and setup instructions
   - Creating webhook endpoints
   - Supported events (scenario and deal events)
   - Event payload structure
   - Webhook signature verification
   - Retry logic and best practices
   - Testing webhooks

### API Reference Section
4. **API Overview**
   - Base URL
   - Authentication
   - HTTP methods
   - HTTP status codes
   - Error response format
   - Pagination
   - Filtering and sorting
   - API versioning
   - Core resources (Scenarios, Deals)
   - SDK availability

## 📋 Planned: User Resources (brrrr-pricing-engine-resources)

The following user guide content should be created in the resources repository:

### Platform Overview
1. **Welcome to BRRRR Pricing Engine**
   - Platform introduction
   - Key features overview
   - Who should use this platform
   - Getting started checklist

2. **Multi-Workspace Architecture**
   - Understanding workspaces (Pricing Engine, Resources, Documentation)
   - Workspace switcher usage
   - Navigation between apps
   - Port configuration (dev environment)

### User Guides

3. **Account & Organization Management**
   - Creating your first organization
   - Inviting team members
   - Managing user roles and permissions
   - Organization settings
   - Billing and subscription management

4. **Working with Pricing Scenarios**
   - Creating a new pricing scenario
   - Understanding scenario inputs
   - Reading pricing results
   - Saving and sharing scenarios
   - Converting scenarios to deals
   - Scenario status lifecycle

5. **Deal Pipeline Management**
   - Understanding the deal pipeline
   - Creating deals
   - Moving deals through stages
   - Deal status and workflow
   - Assigning team members
   - Adding notes and attachments
   - Pipeline analytics and reporting

6. **Contact Management**
   - Adding borrowers and entities
   - Managing contact information
   - Linking contacts to deals
   - Contact roles and relationships
   - Broker management (for lenders)

7. **Underwriting Guidelines & Programs**
   - Understanding loan programs
   - DSCR vs Bridge loans
   - Configuring program parameters
   - Setting up custom underwriting criteria
   - Program-specific pricing rules

8. **Document Management**
   - Uploading documents
   - Document categories and organization
   - Document templates
   - Sharing documents with team/borrowers
   - Document version control
   - Required documents by loan type

9. **Integrations**
   - Managing API keys
   - Available integrations
   - Webhook setup
   - Third-party connections
   - Integration testing and monitoring

10. **White Label Functionality**
    - White label overview
    - Custom branding setup
    - Logo and color scheme configuration
    - Custom domain setup
    - Client-facing portals
    - Borrower experience customization

11. **Settings & Configuration**
    - Organization settings
    - User preferences
    - Notification settings
    - Email templates
    - Program management
    - Theme customization

12. **Advanced Features**
    - Bulk operations
    - Advanced filtering and search
    - Custom reports and exports
    - Data import/export
    - Automation workflows
    - Keyboard shortcuts

13. **Security & Compliance**
    - Data security best practices
    - Access control
    - Audit logs
    - Compliance features
    - Data retention policies
    - GDPR and privacy

14. **Troubleshooting & FAQs**
    - Common issues and solutions
    - Frequently asked questions
    - Support resources
    - Contact information
    - System status and updates

### Quick Reference Guides

15. **Keyboard Shortcuts**
    - Global shortcuts
    - Page-specific shortcuts
    - Quick navigation

16. **Glossary**
    - DSCR (Debt Service Coverage Ratio)
    - LTV (Loan-to-Value)
    - ARV (After Repair Value)
    - Bridge loans
    - Other industry terms

17. **Video Tutorials**
    - Getting started video
    - Creating your first scenario
    - Understanding pricing results
    - Managing your pipeline
    - Advanced features walkthrough

## Implementation Notes

### For Developer Documentation (Completed)
- ✅ All articles use proper heading hierarchy (h2-h4, no h1)
- ✅ Code examples include proper syntax highlighting
- ✅ Content is organized by topic and user journey
- ✅ All commits were made with descriptive messages

### For User Resources (To Be Created)
- Use similar structure to developer docs
- Include screenshots and visual guides where helpful
- Write for non-technical audience
- Include step-by-step instructions
- Add videos/GIFs for complex workflows
- Cross-link related articles
- Include searchable keywords

## Next Steps

1. **Set up MCP for Resources Repo** (if not already done)
   - Add BASEHUB_TOKEN for resources repo to MCP configuration
   - Or manually create content through BaseHub UI

2. **Create Content in Priority Order**
   - Start with Platform Overview and basic user guides
   - Add advanced features after core content is complete
   - Include Quick Reference guides last

3. **Review and Iterate**
   - Have team review content for accuracy
   - Get feedback from actual users
   - Update based on common support questions

4. **Maintain and Update**
   - Update docs when features change
   - Add new guides for new features
   - Keep troubleshooting section current

## Repository Details

- **Docs Repo**: Connected to MCP via `user-basehub_docs`
- **Docs Token**: `apps/docs/.env.local` → `BASEHUB_TOKEN`
- **Resources Token**: `apps/resources/.env.local` → `BASEHUB_TOKEN`
- **Apps Integration**: Both apps query BaseHub via Pump component and populate sidebars dynamically
