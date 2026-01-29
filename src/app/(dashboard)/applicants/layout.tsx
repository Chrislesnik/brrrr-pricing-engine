import { Header } from "@/components/layout/header"

interface Props {
  children: React.ReactNode
}

export default function ApplicantsLayout({ children }: Props) {
  return (
    <>
      <Header />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-auto p-1 pr-4">
          {children}
        </div>
      </div>
    </>
  )
}
