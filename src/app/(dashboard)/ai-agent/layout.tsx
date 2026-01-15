import { Header } from "@/components/layout/header"

interface Props {
  children: React.ReactNode
}

export default function AIAgentLayout({ children }: Props) {
  return (
    <>
      <Header />
      <div
        data-layout="fixed"
        className="flex flex-1 flex-col overflow-hidden p-0"
      >
        <div className="flex w-full flex-1 flex-col overflow-y-hidden p-0">
          {children}
        </div>
      </div>
    </>
  )
}


