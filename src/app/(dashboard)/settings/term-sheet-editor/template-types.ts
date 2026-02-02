/**
 * Term Sheet Template Types
 */

export interface TermSheetTemplate {
  id: string
  name: string
  html_content: string // GrapesJS HTML output
  gjs_data: object     // GrapesJS project JSON for re-editing
  created_at: Date
  updated_at: Date
  thumbnail_url?: string // Optional cached preview
}

// Default blank template HTML for new templates
export const defaultTemplateHtml = `<!DOCTYPE html>
<html>
  <body style="padding: 40px; font-family: Arial, Helvetica, sans-serif">
    <header style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px;">
      <div>
        <h1 style="margin: 0; font-size: 28px;">TERM SHEET</h1>
        <p style="margin: 8px 0 4px 0; color: #666;">Loan Reference: #TS-00000</p>
        <p style="margin: 4px 0; color: #666;">Date: ${new Date().toLocaleDateString()}</p>
      </div>
      <div style="text-align: right; line-height: 1.6;">
        <strong style="font-size: 16px;">Your Company Name</strong><br />
        123 Business Street<br />
        City, State ZIP
      </div>
    </header>

    <section style="margin-bottom: 30px;">
      <h3 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px;">Borrower Information</h3>
      <div style="line-height: 1.6;">
        <strong>Borrower Name:</strong> [Borrower Name]<br/>
        <strong>Entity:</strong> [Entity Name, LLC]<br/>
        <strong>Address:</strong> [Street Address, City, State ZIP]<br/>
      </div>
    </section>

    <section style="margin-bottom: 30px;">
      <h3 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px;">Loan Terms</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tbody>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; width: 40%; background: #f9f9f9;"><strong>Loan Amount</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">$0.00</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Interest Rate</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">0.00%</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Loan Term</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd;">0 Months</td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer style="text-align: center; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 20px;">
      <p style="margin: 4px 0;">This term sheet is for discussion purposes only and does not constitute a commitment to lend.</p>
    </footer>
  </body>
</html>`

// Mock templates for UI development (will be replaced with Supabase data)
export const mockTemplates: TermSheetTemplate[] = [
  {
    id: "1",
    name: "Standard DSCR Term Sheet",
    html_content: defaultTemplateHtml,
    gjs_data: {},
    created_at: new Date("2026-01-15"),
    updated_at: new Date("2026-01-28"),
  },
  {
    id: "2", 
    name: "Bridge Loan Template",
    html_content: defaultTemplateHtml,
    gjs_data: {},
    created_at: new Date("2026-01-20"),
    updated_at: new Date("2026-01-25"),
  },
  {
    id: "3",
    name: "Fix & Flip Term Sheet",
    html_content: defaultTemplateHtml,
    gjs_data: {},
    created_at: new Date("2026-01-22"),
    updated_at: new Date("2026-01-30"),
  },
]
