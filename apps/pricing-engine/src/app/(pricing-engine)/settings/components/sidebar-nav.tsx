"use client"

import { JSX, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@repo/lib/cn"
import { buttonVariants } from "@repo/ui/shadcn/button"
import { ScrollArea } from "@repo/ui/shadcn/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/shadcn/select"

interface Props extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: JSX.Element
  }[]
}

export default function SidebarNav({ className, items, ...props }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [val, setVal] = useState(pathname ?? "/settings")

  const handleSelect = (e: string) => {
    setVal(e)
    router.push(e)
  }

  return (
    <>
      <div className="p-1 md:hidden">
        <Select value={val} onValueChange={handleSelect}>
          <SelectTrigger className="h-10 sm:w-48">
            <SelectValue placeholder="Theme" />
          </SelectTrigger>
          <SelectContent>
            {items.map((item) => (
              <SelectItem key={item.href} value={item.href}>
                <div className="flex gap-x-4 px-2 py-0.5">
                  <span className="scale-125 [&_svg]:size-[1.125rem]">
                    {item.icon}
                  </span>
                  <span className="text-md">{item.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        className="bg-background hidden w-full min-w-48 px-1 py-2 md:block"
      >
        <nav
          className={cn(
            "flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0",
            className
          )}
          {...props}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                pathname === item.href
                  ? "bg-muted hover:bg-muted"
                  : "hover:bg-transparent hover:underline",
                "justify-start"
              )}
            >
              <span className="mr-2 [&_svg]:size-[1.125rem]">{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </>
  )
}
