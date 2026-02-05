"use client"

import { useEffect, useRef } from "react"

/**
 * OrgThemeLoader fetches and applies the organization's custom theme on mount.
 * It injects CSS variables into the document head that override the default theme.
 * This component should be placed inside an authenticated layout (e.g., dashboard).
 */
export function OrgThemeLoader() {
  const loadedRef = useRef(false)

  useEffect(() => {
    // Only load once
    if (loadedRef.current) return
    loadedRef.current = true

    async function loadOrgTheme() {
      try {
        const res = await fetch("/api/org/theme")
        if (!res.ok) return

        const data = await res.json()
        
        // Only apply if theme data exists
        if (!data.light || Object.keys(data.light).length === 0) {
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
  }, [])

  // This component doesn't render anything
  return null
}
