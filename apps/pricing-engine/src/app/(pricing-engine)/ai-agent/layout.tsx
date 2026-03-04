
interface Props {
  children: React.ReactNode
}

export default function AIAgentLayout({ children }: Props) {
  return (
    <>
      <div
        data-layout="fixed"
        className="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
      >
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-hidden p-0">
          {children}
        </div>
      </div>
    </>
  )
}


