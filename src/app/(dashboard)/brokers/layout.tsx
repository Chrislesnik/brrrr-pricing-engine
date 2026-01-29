import { Header } from "@/components/layout/header"

interface Props {
  children: React.ReactNode
}

export default function BrokersLayout({ children }: Props) {
  return (
    <>
      <Header />
      <div
        data-layout="fixed"
        className="flex flex-1 flex-col overflow-hidden p-4"
      >
        <div className="flex w-full flex-1 flex-col overflow-auto p-1 pr-4">
          {children}
        </div>
      </div>
    </>
  )
}


