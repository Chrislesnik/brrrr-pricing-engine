"use client"

import { SWRConfig } from "swr"

interface SWRProviderProps {
  children: React.ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        dedupingInterval: 5 * 60 * 1000,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        keepPreviousData: true,
        errorRetryCount: 2,
        fetcher: (url: string) => fetch(url).then((res) => res.json()),
      }}
    >
      {children}
    </SWRConfig>
  )
}
