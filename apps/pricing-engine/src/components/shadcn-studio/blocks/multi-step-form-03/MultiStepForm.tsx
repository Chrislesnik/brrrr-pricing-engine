"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import * as Stepperize from "@stepperize/react"
import { ChevronLeft, ChevronRight, CreditCard } from "lucide-react"
import { FaUserShield } from "react-icons/fa6"
import { TbHomeSearch } from "react-icons/tb"
import { cn } from "@repo/lib/cn"
import { Button } from "@repo/ui/shadcn/button"
import CartStep from "./CartStep"

const { useStepper } = Stepperize.defineStepper(
  { id: "background", title: "Background", icon: FaUserShield },
  { id: "credit", title: "Credit", icon: CreditCard },
  { id: "confirmation", title: "Appraisal", icon: TbHomeSearch }
)

const orderItems = [
  {
    title: "iPhone 16 Pro Max",
    soldBy: "ACME Inc.",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80",
    mrp: 1099,
    sellingPrice: 998,
    quantity: 1,
    estimatedDeliveryDate: "December 31, 2026",
  },
  {
    title: "HomePod",
    soldBy: "ACME Inc.",
    image:
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80",
    mrp: 299,
    sellingPrice: 249,
    quantity: 1,
    estimatedDeliveryDate: "December 31, 2026",
  },
]

type CarouselItem = { name?: string | null; id?: string }

const MultiStepForm = ({
  className,
  entityName,
  guarantors = [],
}: {
  className?: string
  entityName?: string | null
  guarantors?: CarouselItem[]
}) => {
  const stepper = useStepper()
  const labels = useMemo(() => {
    const guarantorLabels =
      guarantors?.map((g, idx) => {
        const name = g?.name?.trim()
        return name && name.length > 0 ? name : `Guarantor ${idx + 1}`
      }) ?? []

    if (stepper.current.id === "credit") {
      // On the Credit step we only surface guarantors in the carousel.
      return guarantorLabels.length > 0 ? guarantorLabels : ["Guarantor"]
    }

    const entityLabel = entityName?.trim() || "Entity"
    const combined = [entityLabel, ...guarantorLabels]
    return combined.length > 0 ? combined : ["Entity"]
  }, [entityName, guarantors, stepper.current.id])

  const [carouselIndex, setCarouselIndex] = useState(0)

  useEffect(() => {
    if (carouselIndex >= labels.length) {
      setCarouselIndex(0)
    }
  }, [carouselIndex, labels.length])

  const prev = () =>
    setCarouselIndex((i) => (i - 1 + labels.length) % labels.length)
  const next = () => setCarouselIndex((i) => (i + 1) % labels.length)

  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {/* Compact header: stepper tabs + entity carousel in one row */}
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Step tabs */}
          <nav aria-label="Multi Steps" className="flex-1">
            <ol className="flex items-center gap-1">
              {stepper.all.map((step, index, array) => (
                <Fragment key={step.id}>
                  <li>
                    <button
                      type="button"
                      onClick={() => stepper.goTo(step.id)}
                      className={cn(
                        "hover:text-foreground focus-visible:ring-ring flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                        stepper.current.id === step.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      )}
                      aria-pressed={stepper.current.id === step.id}
                    >
                      <step.icon className="size-5 shrink-0" aria-hidden="true" />
                      <span>{step.title}</span>
                    </button>
                  </li>
                  {index < array.length - 1 && (
                    <li>
                      <ChevronRight
                        className="text-muted-foreground size-4 shrink-0"
                        aria-hidden="true"
                      />
                    </li>
                  )}
                </Fragment>
              ))}
            </ol>
          </nav>

          {/* Entity / guarantor carousel -- only show on non-appraisal tabs */}
          {stepper.current.id !== "confirmation" && (
            <div className="flex items-center gap-2">
              {labels.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={prev}
                  aria-label="Previous item"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              <div className="min-w-[140px] text-center text-sm font-medium">
                {labels[carouselIndex]}
              </div>
              {labels.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={next}
                  aria-label="Next item"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Step content -- fills remaining height, scrollable */}
      <div className="relative min-h-0 flex-1 overflow-auto p-4 sm:p-6">
        {stepper.switch({
          background: () => (
            <CartStep
              data={orderItems}
              stepper={stepper}
              isEntity={carouselIndex === 0}
            />
          ),
          credit: () => (
            <CartStep
              data={orderItems}
              stepper={stepper}
              currentBorrowerId={guarantors?.[carouselIndex]?.id ?? undefined}
            />
          ),
          confirmation: () => <CartStep data={orderItems} stepper={stepper} />,
        })}
      </div>
    </div>
  )
}

export type OrderItemType = (typeof orderItems)[number]
export type StepperType = ReturnType<typeof useStepper>

export default MultiStepForm
