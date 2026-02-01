"use client"

import { useEffect, useState } from "react"
import StudioEditorComponent from "@grapesjs/studio-sdk/react"
import "@grapesjs/studio-sdk/style"
import {
  presetPrintable,
  canvasFullSize,
  layoutSidebarButtons,
  googleFontsAssetProvider,
  rteProseMirror,
  flexComponent,
  dataSourceHandlebars,
} from "@grapesjs/studio-sdk-plugins"


interface StudioEditorWrapperProps {
  globalData: Record<string, string>
  variableOptions: { id: string; label: string }[]
}

export function StudioEditorWrapper({
  globalData,
  variableOptions,
}: StudioEditorWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Wait for client-side mount to avoid SSR issues
  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <StudioEditorComponent
      options={{
        licenseKey: "",
        fonts: {
          enableFontManager: true,
        },
        dataSources: {
          globalData: globalData,
          blocks: true,
        },
        plugins: [
          presetPrintable,
          canvasFullSize,
          layoutSidebarButtons,
          googleFontsAssetProvider.init({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY || "",
          }),
          dataSourceHandlebars,
          rteProseMirror.init({
            toolbar({ items, layouts, commands }) {
              return [
                ...items,
                layouts.separator,
                {
                  id: "variables",
                  type: "selectField",
                  emptyState: "Insert Variable",
                  options: variableOptions,
                  onChange: ({ value }) =>
                    commands.text.replace(value, { select: true }),
                },
              ]
            },
          }),
          flexComponent,
        ],
        project: {
          type: "document",
          default: {
            pages: [
              {
                name: "Term Sheet",
                component: `<!DOCTYPE html>
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
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Loan Type</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">[DSCR / Bridge]</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Prepayment Penalty</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">[Terms]</td>
                            </tr>
                          </tbody>
                        </table>
                      </section>

                      <section style="margin-bottom: 30px;">
                        <h3 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px;">Property Information</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; width: 40%; background: #f9f9f9;"><strong>Property Address</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">[Property Address]</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Property Type</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">[SFR / Multi-Family / etc.]</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Estimated Value</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">$0.00</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>LTV</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">0%</td>
                            </tr>
                          </tbody>
                        </table>
                      </section>

                      <section style="margin-bottom: 40px;">
                        <h3 style="margin-bottom: 12px; font-size: 14px; text-transform: uppercase; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px;">Fees & Costs</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                          <tbody>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; width: 40%; background: #f9f9f9;"><strong>Origination Fee</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">$0.00</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Processing Fee</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">$0.00</td>
                            </tr>
                            <tr>
                              <td style="padding: 10px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Estimated Closing Costs</strong></td>
                              <td style="padding: 10px; border: 1px solid #ddd;">$0.00</td>
                            </tr>
                          </tbody>
                        </table>
                      </section>

                      <footer style="text-align: center; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 20px;">
                        <p style="margin: 4px 0;">This term sheet is for discussion purposes only and does not constitute a commitment to lend.</p>
                        <p style="margin: 4px 0;">Terms and conditions are subject to change based on final underwriting approval.</p>
                      </footer>
                    </body>
                  </html>
                `,
              },
            ],
          },
        },
        layout: {
          default: {
            type: "row",
            height: "100%",
            children: [
              {
                type: "sidebarLeft",
                children: {
                  type: "panelLayers",
                  header: {
                    label: "Layers",
                    collapsible: false,
                    icon: "layers",
                  },
                },
              },
              {
                type: "canvasSidebarTop",
                sidebarTop: {
                  rightContainer: {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    buttons: ({ items, editor }: { items: any[]; editor: any }) => [
                      {
                        id: "print",
                        icon: '<svg viewBox="0 0 24 24"><path d="M18 3H6v4h12m1 5a1 1 0 0 1-1-1 1 1 0 0 1 1-1 1 1 0 0 1 1 1 1 1 0 0 1-1 1m-3 7H8v-5h8m3-6H5a3 3 0 0 0-3 3v6h4v4h12v-4h4v-6a3 3 0 0 0-3-3Z"/></svg>',
                        tooltip: "Print",
                        onClick: () => editor.runCommand("presetPrintable:print"),
                      },
                      ...items.filter(
                        (item: { id: string }) =>
                          !["showImportCode", "fullscreen"].includes(item.id)
                      ),
                      {
                        id: "zoom-out",
                        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
                        tooltip: "Zoom Out",
                        onClick: () => {
                          const zoom = editor.Canvas.getZoom()
                          editor.Canvas.setZoom(Math.max(zoom - 10, 10))
                        },
                      },
                      {
                        id: "zoom-in",
                        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>',
                        tooltip: "Zoom In",
                        onClick: () => {
                          const zoom = editor.Canvas.getZoom()
                          editor.Canvas.setZoom(Math.min(zoom + 10, 200))
                        },
                      },
                      {
                        id: "zoom-fit",
                        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
                        tooltip: "Fit to Screen (100%)",
                        onClick: () => {
                          editor.Canvas.setZoom(100)
                        },
                      },
                    ],
                  },
                },
              },
              // Use built-in sidebarRight without custom component
              { type: "sidebarRight" },
            ],
          },
        },
      }}
    />
  )
}
