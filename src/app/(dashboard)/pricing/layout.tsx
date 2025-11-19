import { Header } from "@/components/layout/header"

interface Props {
  children: React.ReactNode
}

export default function PricingLayout({ children }: Props) {
  return (
    <>
      <Header />
      <main id="main-content" className="flex h-full flex-1 flex-col p-4">
        {children}
      </main>
    </>
  )
}


