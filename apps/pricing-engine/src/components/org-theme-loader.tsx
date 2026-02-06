"use client"

import { useEffect, useRef } from "react"
import { useOrganization } from "@clerk/nextjs"

/**
 * Convert hex color to HSL values (space-separated, no hsl() wrapper)
 * e.g. "#ffffff" -> "0 0% 100%"
 */
function hexToHslValues(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, "")
  
  // Parse hex to RGB
  let r = 0, g = 0, b = 0
  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16)
    g = parseInt(hex.substring(2, 4), 16)
    b = parseInt(hex.substring(4, 6), 16)
  } else {
    // Invalid hex, return as-is
    return hex
  }
  
  // Convert to 0-1 range
  r /= 255
  g /= 255
  b /= 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  // Return as "H S% L%" format (what Tailwind expects)
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Convert a CSS value - if it's a hex color, convert to HSL; otherwise keep as-is
 */
function convertCssValue(key: string, value: string): string {
  // Non-color properties should be kept as-is
  const nonColorProps = ["radius", "font", "shadow", "spacing", "size"]
  if (nonColorProps.some(prop => key.includes(prop))) {
    return value
  }
  
  // If it's a hex color, convert to HSL
  if (value.startsWith("#")) {
    return hexToHslValues(value)
  }
  
  return value
}

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

        // Convert hex values to HSL format for Tailwind CSS compatibility
        const lightTokens = Object.entries(data.light as Record<string, string>)
          .map(([key, value]) => `  --${key}: ${convertCssValue(key, value)};`)
          .join("\n")

        const darkTokens = Object.entries(data.dark as Record<string, string>)
          .map(([key, value]) => `  --${key}: ${convertCssValue(key, value)};`)
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
