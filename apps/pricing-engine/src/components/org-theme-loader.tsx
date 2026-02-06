"use client"

import { useEffect, useRef } from "react"
import { useOrganization } from "@clerk/nextjs"

/**
 * OrgThemeLoader fetches and applies the organization's custom theme on mount
 * and whenever the active organization changes.
 * It injects CSS variables into the document head that override the default theme.
 */
export function OrgThemeLoader() {
  const { organization } = useOrganization()
  const lastOrgIdRef = useRef<string | null>(null)

  useEffect(() => {
    // Skip if no organization or same org as before
    const currentOrgId = organization?.id ?? null
    
    // Always load on first render, or when org changes
    if (lastOrgIdRef.current === currentOrgId && lastOrgIdRef.current !== null) {
      return
    }
    
    lastOrgIdRef.current = currentOrgId

    async function loadOrgTheme() {
      // If no organization, remove any custom theme
      if (!currentOrgId) {
        const styleElement = document.getElementById("tinte-dynamic-theme")
        if (styleElement) {
          styleElement.remove()
        }
        return
      }

      try {
        const res = await fetch("/api/org/theme")
        if (!res.ok) return

        const data = await res.json()
        
        // Only apply if theme data exists
        if (!data.light || Object.keys(data.light).length === 0) {
          // Remove any existing custom theme if org has no custom theme
          const styleElement = document.getElementById("tinte-dynamic-theme")
          if (styleElement) {
            styleElement.remove()
          }
          return
        }

        // Create or update the dynamic theme style element
        const styleId = "tinte-dynamic-theme"
        let styleElement = document.getElementById(styleId) as HTMLStyleElement
        
        if (!styleElement) {
          styleElement = document.createElement("style")
          styleElement.id = styleId
          document.head.appendChild(styleElement)
        }

        const lightTokens = Object.entries(data.light as Record<string, string>)
          .map(([key, value]) => `  --${key}: ${value};`)
          .join("\n")

        const darkTokens = Object.entries(data.dark as Record<string, string>)
          .map(([key, value]) => `  --${key}: ${value};`)
          .join("\n")

        styleElement.textContent = `:root {\n${lightTokens}\n}\n\n.dark {\n${darkTokens}\n}`
      } catch (error) {
        console.error("Failed to load organization theme:", error)
      }
    }

    loadOrgTheme()
  }, [organization?.id])

  // This component doesn't render anything
  return null
}
