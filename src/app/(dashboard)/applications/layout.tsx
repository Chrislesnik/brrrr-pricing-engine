import { Header } from "@/components/layout/header"

interface Props {
  children: React.ReactNode
}

export default function ApplicationsLayout({ children }: Props) {
  return (
    <>
      <Header />
      <div
        data-layout="fixed"
        className="flex flex-1 flex-col overflow-hidden p-4"
      >
        <div className="flex w-full flex-1 flex-col overflow-y-scroll p-1 pr-4 md:overflow-y-hidden">
          {children}
        </div>
      </div>
    </>
  )
}





