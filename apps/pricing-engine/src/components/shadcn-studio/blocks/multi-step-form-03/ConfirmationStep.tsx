import { Fragment } from 'react'

import { Clock8Icon, CreditCardIcon, ShipIcon, TruckIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { OrderItemType } from '@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm'

const PaymentStep = ({ data }: { data: OrderItemType[] }) => {
  return (
    <div className='flex flex-col gap-6'>
      <div className='mx-auto flex max-w-5xl flex-col items-center gap-5 text-center'>
        <p className='text-2xl font-medium'>Thank you! 😇</p>
        <p className='text-muted-foreground font-medium'>
          Your order <span className='text-foreground'>#1545256525</span> has been placed!
        </p>
        <p className='text-muted-foreground font-medium'>
          We sent an email to <span className='text-foreground'>john.doe@example.com</span> with your order confirmation
          and receipt. if the email hasn&apos;t arrived within two minutes, please check your spam folder to see if the
          email was routed there.
        </p>
        <div className='flex items-center gap-1.5'>
          <Clock8Icon className='size-4 shrink-0' />
          <span className='font-medium'>Time placed: 10/25/2025 13:35pm</span>
        </div>
      </div>
      <div className='grid grid-cols-1 rounded-md border md:grid-cols-3'>
        <div className='flex flex-col items-start gap-6 p-6 max-md:border-b md:border-r'>
          <div className='flex items-center gap-2.5'>
            <TruckIcon className='shrink-0' />
            <span className='text-lg font-medium'>Shipping</span>
          </div>
          <div>
            <p className='font-medium'>John Doe (Default)</p>
            <p className='text-muted-foreground'>4135 Parkway Street,</p>
            <p className='text-muted-foreground'>Los Angeles, CA, 90017.</p>
          </div>
          <p className='text-muted-foreground'>+1 1234567890</p>
        </div>
        <div className='flex flex-col items-start gap-6 p-6 max-md:border-b md:border-r'>
          <div className='flex items-center gap-2.5'>
            <CreditCardIcon className='shrink-0' />
            <span className='text-lg font-medium'>Billing Address</span>
          </div>
          <div>
            <p className='font-medium'>John Doe (Default)</p>
            <p className='text-muted-foreground'>4135 Parkway Street,</p>
            <p className='text-muted-foreground'>Los Angeles, CA, 90017.</p>
          </div>
          <p className='text-muted-foreground'>+1 1234567890</p>
        </div>
        <div className='flex flex-col items-start gap-6 p-6'>
          <div className='flex items-center gap-2.5'>
            <ShipIcon className='shrink-0' />
            <span className='text-lg font-medium'>Shipping Method</span>
          </div>
          <div>
            <p className='font-medium'>Preferred Method:</p>
            <p className='text-muted-foreground'>Standard Delivery</p>
            <p className='text-muted-foreground'>(Normally 3-4 business days)</p>
          </div>
        </div>
      </div>
      <div className='grid grid-cols-1 items-start gap-6 md:grid-cols-3'>
        <div className='flex flex-col rounded-md border md:col-span-2'>
          {data.map((item, index) => (
            <Fragment key={index}>
              <div className='flex items-center gap-6 p-3.5 max-sm:flex-col'>
                <img src={item.image} alt={item.title} className='w-21' />
                <div className='flex flex-1 flex-col items-start gap-3 max-sm:items-center'>
                  <p className='text-lg font-medium'>{item.title}</p>
                  <div className='flex flex-wrap items-center gap-1.5 max-sm:justify-center'>
                    <span className='text-muted-foreground'>Sold by:</span>
                    <span className='text-lg font-semibold'>{item.soldBy}</span>
                    <Badge className='h-5.5 rounded-sm border-none bg-green-600/10 font-normal text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
                      In stock
                    </Badge>
                  </div>
                </div>
                <div className='flex items-center gap-1.5'>
                  <span className='text-lg font-semibold'>{`$${item.sellingPrice}/`}</span>
                  <span className='text-muted-foreground text-sm line-through'>{`$${item.mrp}`}</span>
                </div>
              </div>
              {index < data.length - 1 && <Separator />}
            </Fragment>
          ))}
        </div>
        <div className='flex flex-col rounded-md border'>
          <div className='flex flex-col gap-4 p-6'>
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
          <div className='flex items-center justify-between gap-4 p-6'>
            <p className='text-lg font-medium'>Total</p>
            <p className='text-right font-semibold'>
              {`$${(data.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0) - 50).toFixed(2)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PaymentStep
