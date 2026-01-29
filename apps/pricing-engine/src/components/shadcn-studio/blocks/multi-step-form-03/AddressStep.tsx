import { CrownIcon, StarIcon, UserIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { OrderItemType, StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm'

const AddressStep = ({ data, stepper }: { data: OrderItemType[]; stepper: StepperType }) => {
  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='flex flex-col gap-6 lg:col-span-2'>
        <p className='font-semibold'>Select your preferable address</p>
        <RadioGroup className='justify-items-center gap-6 sm:grid-cols-2' defaultValue='home'>
          <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full gap-3 rounded-md border p-4 outline-none'>
            <RadioGroupItem
              value='home'
              id='address-home'
              className='size-5 after:absolute after:inset-0 [&_svg]:size-3'
              aria-describedby='address-home-description'
              aria-label='radio-address-home'
            />
            <div className='flex flex-1 flex-col gap-3.5'>
              <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
                <p className='font-medium'>John Doe (Default)</p>
                <Badge className='bg-primary/10 text-primary focus-visible:ring-primary/20 h-5.5 rounded-sm border-none font-normal focus-visible:outline-none'>
                  Home
                </Badge>
              </div>
              <p id='address-home-description' className='text-muted-foreground text-sm'>
                4135 Parkway Street, Los Angeles,90017. Mobile: 1234567890 Card/Cash on delivery available
              </p>
              <Separator className='mt-auto' />
              <div className='flex flex-wrap items-center gap-5'>
                <a href='#' className='font-semibold'>
                  Edit
                </a>
                <a href='#' className='font-semibold'>
                  Remove
                </a>
              </div>
            </div>
          </div>
          <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full gap-3 rounded-md border p-4 outline-none'>
            <RadioGroupItem
              value='office'
              id='address-office'
              className='size-5 after:absolute after:inset-0 [&_svg]:size-3'
              aria-describedby='address-office-description'
              aria-label='radio-address-office'
            />
            <div className='flex flex-1 flex-col gap-3.5'>
              <div className='flex flex-wrap items-center justify-between gap-x-4 gap-y-1'>
                <p className='font-medium'>ACME Inc.</p>
                <Badge className='h-5.5 rounded-sm border-none bg-green-600/10 font-normal text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
                  Office
                </Badge>
              </div>
              <p id='address-office-description' className='text-muted-foreground text-sm'>
                87 hoffman avenue, New York, NY, 10016 Mobile: 1234567890 Card/Cash on delivery available
              </p>
              <Separator className='mt-auto' />
              <div className='flex flex-wrap items-center gap-5'>
                <a href='#' className='font-semibold'>
                  Edit
                </a>
                <a href='#' className='font-semibold'>
                  Remove
                </a>
              </div>
            </div>
          </div>
        </RadioGroup>
        <Button className='bg-primary/10 text-primary hover:bg-primary/20 focus-visible:ring-primary/20 dark:focus-visible:ring-primary/40 sm:self-start'>
          Add new address
        </Button>
        <p className='font-semibold'>Choose Delivery Speed</p>
        <RadioGroup className='justify-items-center gap-6 sm:grid-cols-3' defaultValue='basic'>
          <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full flex-col items-center gap-4 rounded-md border p-4 shadow-xs outline-none'>
            <RadioGroupItem
              value='basic'
              id='address-speed-basic'
              className='order-1 size-5 after:absolute after:inset-0 after:z-1 [&_svg]:size-3'
              aria-describedby='basic-description'
              aria-label='radio-basic'
            />
            <div className='grid grow justify-items-center gap-4'>
              <UserIcon className='size-10 stroke-1' />
              <div className='flex flex-col items-center gap-2 text-center'>
                <p className='font-medium'>Basic</p>
                <p id='basic-description' className='text-muted-foreground text-sm'>
                  Get your product in 1 week
                </p>
              </div>
              <Badge className='absolute top-3 right-3.5 h-5.5 rounded-sm border-none bg-green-600/10 font-normal text-green-600 uppercase focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'>
                Free
              </Badge>
            </div>
          </div>
          <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full flex-col items-center gap-4 rounded-md border p-4 shadow-xs outline-none'>
            <RadioGroupItem
              value='express'
              id='address-speed-express'
              className='order-1 size-5 after:absolute after:inset-0 after:z-1 [&_svg]:size-3'
              aria-describedby='express-description'
              aria-label='radio-express'
            />
            <div className='grid grow justify-items-center gap-4'>
              <StarIcon className='size-10 stroke-1' />
              <div className='flex flex-col items-center gap-2 text-center'>
                <p className='font-medium'>Express</p>
                <p id='express-description' className='text-muted-foreground text-sm'>
                  Get your product in 3-4 days
                </p>
              </div>
              <Badge className='bg-primary/10 text-primary focus-visible:ring-primary/20 absolute top-3 right-3.5 h-5.5 rounded-sm border-none font-normal focus-visible:outline-none'>
                $10
              </Badge>
            </div>
          </div>
          <div className='border-input has-data-[state=checked]:border-primary/50 relative flex w-full flex-col items-center gap-4 rounded-md border p-4 shadow-xs outline-none'>
            <RadioGroupItem
              value='premium'
              id='address-speed-premium'
              className='order-1 size-5 after:absolute after:inset-0 after:z-1 [&_svg]:size-3'
              aria-describedby='premium-description'
              aria-label='radio-premium'
            />
            <div className='grid grow justify-items-center gap-4'>
              <CrownIcon className='size-10 stroke-1' />
              <div className='flex flex-col items-center gap-2 text-center'>
                <p className='font-medium'>Premium</p>
                <p id='premium-description' className='text-muted-foreground text-sm'>
                  Get your product in 0-1 days
                </p>
              </div>
              <Badge className='bg-primary/10 text-primary focus-visible:ring-primary/20 absolute top-3 right-3.5 h-5.5 rounded-sm border-none font-normal focus-visible:outline-none'>
                $15
              </Badge>
            </div>
          </div>
        </RadioGroup>
      </div>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-col gap-6 rounded-md border p-6'>
          <p className='font-semibold'>Estimated Delivery</p>
          {data.map((item, index) => (
            <div key={index} className='flex items-center gap-6'>
              <img src={item.image} alt={item.title} className='w-20' />
              <div className='text-muted-foreground flex flex-col items-start gap-1.5'>
                <p className='font-medium'>{item.title}</p>
                <p className='font-light'>{item.estimatedDeliveryDate}</p>
              </div>
            </div>
          ))}
          <Separator />
          <div className='flex flex-col items-start gap-2'>
            <p className='text-lg font-medium'>Price Details</p>
            <div className='flex w-full flex-col gap-3'>
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
              <Separator />
              <div className='flex items-center justify-between gap-4'>
                <p className='text-lg font-medium'>Total</p>
                <p className='text-right font-semibold'>
                  {`$${(data.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0) - 50).toFixed(2)}`}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button onClick={stepper.next}>Place Order</Button>
      </div>
    </div>
  )
}

export default AddressStep
