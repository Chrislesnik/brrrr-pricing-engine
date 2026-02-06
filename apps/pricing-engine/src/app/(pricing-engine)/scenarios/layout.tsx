
interface Props {
  children: React.ReactNode
}

export default function ScenariosLayout({ children }: Props) {
  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden p-4 min-w-0 max-w-full">
        <div className="flex w-full flex-1 flex-col overflow-x-auto overflow-y-hidden p-1 pr-4 min-w-0">
          {children}
        </div>
      </div>
    </>
  )
}
