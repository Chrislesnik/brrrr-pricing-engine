'use client'

import { Fragment, useState } from 'react'

import * as Stepperize from '@stepperize/react'
import { CheckCircle2, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react'
import { FaUserShield } from 'react-icons/fa6'
import { TbHomeSearch } from 'react-icons/tb'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import CartStep from './CartStep'
import ConfirmationStep from './ConfirmationStep'

const { useStepper } = Stepperize.defineStepper(
  { id: 'background', title: 'Background', icon: FaUserShield },
  { id: 'credit', title: 'Credit', icon: CreditCard },
  { id: 'confirmation', title: 'Appraisal', icon: TbHomeSearch }
)

const orderItems: OrderItemType[] = [
  {
    title: 'iPhone 16 Pro Max',
    soldBy: 'ACME Inc.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=80',
    mrp: 1099,
    sellingPrice: 998,
    quantity: 1,
    estimatedDeliveryDate: 'December 31, 2026',
  },
  {
    title: 'HomePod',
    soldBy: 'ACME Inc.',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=400&q=80',
    mrp: 299,
    sellingPrice: 249,
    quantity: 1,
    estimatedDeliveryDate: 'December 31, 2026',
  },
]

const carouselItems = ['Entity', 'Guarantor 1', 'Guarantor 2', 'Guarantor 3', 'Guarantor 4']

const MultiStepForm = ({ className }: { className?: string }) => {
  const stepper = useStepper()
  const [carouselIndex, setCarouselIndex] = useState(0)

  const prev = () => setCarouselIndex((i) => (i - 1 + carouselItems.length) % carouselItems.length)
  const next = () => setCarouselIndex((i) => (i + 1) % carouselItems.length)

  return (
    <Card className={cn(className)}>
      <CardContent className="p-4 sm:p-6">
        <nav aria-label="Multi Steps">
          <ol className="flex justify-center gap-x-6 gap-y-6 max-sm:flex-col sm:items-center md:gap-x-12">
            {stepper.all.map((step, index, array) => (
              <Fragment key={step.id}>
                <li>
                  <button
                    type="button"
                    onClick={() => stepper.goTo(step.id)}
                    className={cn(
                      'flex h-auto w-full shrink-0 items-center justify-start gap-5 sm:flex-col rounded-md transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      stepper.current.id === step.id ? 'text-foreground' : 'text-muted-foreground'
                    )}
                    aria-pressed={stepper.current.id === step.id}
                  >
                    <step.icon className="size-14" aria-hidden="true" />
                    <span className="text-xl">{step.title}</span>
                  </button>
                </li>
                {index < array.length - 1 && (
                  <li className="max-sm:hidden">
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  </li>
                )}
              </Fragment>
            ))}
          </ol>
        </nav>
        <Separator className="my-2" />
        <div className="my-2 flex items-center justify-center gap-4">
          <Button variant="outline" size="icon" onClick={prev} aria-label="Previous item">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[160px] text-center text-sm font-medium">{carouselItems[carouselIndex]}</div>
          <Button variant="outline" size="icon" onClick={next} aria-label="Next item">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Separator className="my-2" />
        {stepper.switch({
          background: () => <CartStep data={orderItems} stepper={stepper} />,
          credit: () => <CartStep data={orderItems} stepper={stepper} />,
          confirmation: () => <CartStep data={orderItems} stepper={stepper} />,
        })}
      </CardContent>
    </Card>
  )
}

export type OrderItemType = (typeof orderItems)[number]
export type StepperType = ReturnType<typeof useStepper>

export default MultiStepForm
