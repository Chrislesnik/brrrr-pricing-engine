'use client'

import { useState } from 'react'

import { CheckCheckIcon, XIcon } from 'lucide-react'
import { usePaymentInputs } from 'react-payment-inputs'

import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import type { OrderItemType, StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm'

const PaymentStep = ({ data, stepper }: { data: OrderItemType[]; stepper: StepperType }) => {
  const [isAlertVisible, setIsAlertVisible] = useState(true)

  const { getCardNumberProps, getExpiryDateProps, getCVCProps } = usePaymentInputs()

  return (
    <div className='grid grid-cols-1 items-start gap-6 lg:grid-cols-3'>
      <div className='flex flex-col gap-8 lg:col-span-2'>
        {isAlertVisible && (
          <Alert className='flex justify-between border-none bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400'>
            <CheckCheckIcon />
            <div className='flex flex-1 flex-col gap-0.5'>
              <AlertTitle>Available Offers</AlertTitle>
              <AlertDescription className='text-green-600/80 dark:text-green-400/80'>
                - 10% instant Discount on Bank of America Corp Bank and credit cards
              </AlertDescription>
              <AlertDescription className='text-green-600/80 dark:text-green-400/80'>
                - 25% cashback voucher of up to $60 on first ever Paypal Transaction. TCA
              </AlertDescription>
            </div>
            <button className='cursor-pointer' onClick={() => setIsAlertVisible(false)}>
              <XIcon className='size-5' />
              <span className='sr-only'>Close</span>
            </button>
          </Alert>
        )}

        <Tabs defaultValue='card' className='max-w-lg gap-6'>
          <TabsList>
            <TabsTrigger value='card'>Card</TabsTrigger>
            <TabsTrigger value='cash-on-delivery'>Cash on Delivery</TabsTrigger>
            <TabsTrigger value='gift-card'>Gift Card</TabsTrigger>
          </TabsList>
          <TabsContent value='card'>
            <div className='grid grid-cols-4 gap-6'>
              <div className='col-span-4 flex flex-col items-start gap-3.5'>
                <Label htmlFor='multi-step-payment-card-number' className='text-base'>
                  Card Number
                </Label>
                <Input
                  {...getCardNumberProps()}
                  id='multi-step-payment-card-number'
                  placeholder='1234 5678 9012 3456'
                />
              </div>
              <div className='col-span-4 flex flex-col items-start gap-3.5 sm:col-span-2'>
                <Label htmlFor='multi-step-payment-name' className='text-base'>
                  Card Name
                </Label>
                <Input id='multi-step-payment-name' placeholder='John Doe' />
              </div>
              <div className='col-span-2 flex flex-col items-start gap-3.5 sm:col-span-1'>
                <Label htmlFor='multi-step-payment-expiry' className='text-base'>
                  Card Expiry
                </Label>
                <Input {...getExpiryDateProps()} id='multi-step-payment-expiry' placeholder='MM/YY' />
              </div>
              <div className='col-span-2 flex flex-col items-start gap-3.5 sm:col-span-1'>
                <Label htmlFor='multi-step-payment-cvv' className='text-base'>
                  CVV Code
                </Label>
                <Input {...getCVCProps()} id='multi-step-payment-cvv' placeholder='123' />
              </div>
              <div className='col-span-4 mt-2 flex items-center gap-2'>
                <Switch id='multi-step-payment-save-card' />
                <Label htmlFor='multi-step-payment-save-card' className='text-lg'>
                  Save Card for future billing?
                </Label>
              </div>
              <div className='col-span-4 mt-2 flex items-center gap-6'>
                <Button size='lg' onClick={stepper.next}>
                  Save Changes
                </Button>
                <Button variant='secondary' size='lg'>
                  Reset
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value='cash-on-delivery'>
            <p className='text-muted-foreground mb-8'>
              Cash on Delivery is a type of payment method where the recipient make payment for the order at the time of
              delivery rather than in advance.
            </p>
            <Button size='lg' onClick={stepper.next}>
              Pay on Delivery
            </Button>
          </TabsContent>
          <TabsContent value='gift-card'>
            <div className='flex flex-col items-start gap-8'>
              <p className='text-lg font-medium'>Enter Gift Card Details</p>
              <div className='flex w-full flex-col items-start gap-3.5'>
                <Label htmlFor='multi-step-payment-gift-card-number' className='text-base'>
                  Gift Card Number
                </Label>
                <Input id='multi-step-payment-gift-card-number' placeholder='Gift Card Number' />
              </div>
              <div className='flex w-full flex-col items-start gap-3.5'>
                <Label htmlFor='multi-step-payment-gift-card-pin' className='text-base'>
                  Gift Card PIN
                </Label>
                <Input id='multi-step-payment-gift-card-pin' placeholder='Gift Card PIN' />
              </div>
              <Button size='lg' onClick={stepper.next}>
                Redeem Gift Card
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <div className='flex flex-col gap-3.5 rounded-md border p-6'>
        <div className='flex flex-col gap-4'>
          <p className='text-lg font-medium'>Price Details</p>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-muted-foreground'>Order Total</p>
            <p className='text-right font-medium'>
              {`$${(data.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0) - 50).toFixed(2)}`}
            </p>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-muted-foreground'>Delivery Charges</p>
            <div className='flex flex-wrap items-center justify-end gap-x-3 gap-y-1'>
              <Badge className='h-5.5 rounded-sm border-none bg-green-600/10 font-normal text-green-600 uppercase focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
                Free
              </Badge>
              <p className='text-right font-medium line-through'>$5.00</p>
            </div>
          </div>
        </div>
        <Separator />
        <div className='flex flex-col gap-1.5'>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-lg font-medium'>Total</p>
            <p className='text-right font-semibold'>
              {`$${(data.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0) - 50).toFixed(2)}`}
            </p>
          </div>
          <div className='flex items-center justify-between gap-4'>
            <p className='text-lg font-medium'>Deliver To:</p>
            <Badge className='h-5.5 rounded-sm border-none bg-green-600/10 font-normal text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
              Home
            </Badge>
          </div>
        </div>
        <div className='text-muted-foreground'>
          <p>John Doe (default),</p>
          <p>4135 Parkway Street,</p>
          <p>Los Angeles, CA, 90017.</p>
          <p>Mobile: +1 1234567890</p>
        </div>
        <a href='#' className='text-lg font-medium'>
          Change Address
        </a>
      </div>
    </div>
  )
}

export default PaymentStep
