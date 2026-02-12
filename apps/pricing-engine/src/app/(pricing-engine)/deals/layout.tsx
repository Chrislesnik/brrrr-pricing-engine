
interface Props {
  children: React.ReactNode
}

export default function DealsLayout({ children }: Props) {
  return (
    <div data-layout="fixed" className="flex flex-1 flex-col overflow-hidden h-full">
      {children}
    </div>
  )
}
