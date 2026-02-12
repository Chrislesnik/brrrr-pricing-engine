
interface Props {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: Props) {
  return (
    <>

      <div
        data-layout="fixed"
        className="flex min-h-0 flex-1 flex-col overflow-hidden pt-4 px-8 pb-8 md:px-10 md:pb-10"
      >
        <div className="flex min-h-0 w-full flex-1 overflow-auto p-1 pr-4">
          {children}
        </div>
      </div>
    </>
  )
}
