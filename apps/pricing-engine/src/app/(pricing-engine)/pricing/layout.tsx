
interface Props {
  children: React.ReactNode
}

export default function PricingLayout({ children }: Props) {
  return (
    <>
      <main id="main-content" className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        {children}
      </main>
    </>
  )
}


