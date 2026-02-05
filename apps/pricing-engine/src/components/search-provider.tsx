"use client"

import { createContext, useContext } from "react"
import { usePathname } from "next/navigation"
import { CommandMenu } from "./command-menu"

interface SearchContextType {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SearchContext = createContext<SearchContextType | null>(null)

interface Props {
  children: React.ReactNode
  value: SearchContextType
}

export default function SearchProvider({ children, value }: Props) {
  const pathname = usePathname()
  // Don't render CommandMenu on auth pages - it uses useAuth which can conflict with sign-in flow
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up") || pathname?.startsWith("/test-login")
  
  return (
    <SearchContext.Provider value={value}>
      {children}
      {!isAuthPage && <CommandMenu />}
    </SearchContext.Provider>
  )
}

export const useSearch = () => {
  const searchContext = useContext(SearchContext)

  if (!searchContext) {
    throw new Error("useSearch has to be used within <SearchContext.Provider>")
  }

  return searchContext
}
