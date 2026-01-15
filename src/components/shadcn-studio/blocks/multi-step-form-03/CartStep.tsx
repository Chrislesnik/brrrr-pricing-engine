"use client"

import { useState } from 'react'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { OrderItemType, StepperType } from '@/components/shadcn-studio/blocks/multi-step-form-03/MultiStepForm'
import { DateInput } from '@/components/date-input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { ChatPanel } from '@/components/ai/chat-panel'
import { cn } from '@/lib/utils'
import { GiStoneBlock } from 'react-icons/gi'
import { FaFeatherAlt } from 'react-icons/fa'
import { Checkbox } from '@/components/ui/checkbox'

const STATE_OPTIONS = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY",
]

const PROVINCE_OPTIONS = [
  "AB","BC","MB","NB","NL","NT","NS","NU","ON","PE","QC","SK","YT",
]

const COUNTRY_OPTIONS = ["US", "CA"]

const formatSSN = (input: string) => {
  const d = input.replace(/\D+/g, '').slice(0, 9)
  if (d.length <= 3) return d
  if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`
  return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`
}

const formatUSPhone = (input: string) => {
  const digits = input.replace(/\D+/g, '').slice(0, 11) // 1 country + up to 10 national
  if (digits.length === 0) return ''
  const cc = digits[0]
  const national = digits.slice(1)
  if (national.length === 0) return `+${cc}`
  const area = national.slice(0, 3)
  const rest = national.slice(3)
  if (rest.length === 0) return `+${cc} (${area}`
  const prefix = rest.slice(0, 3)
  const line = rest.slice(3, 7)
  if (rest.length <= 3) return `+${cc} (${area}) ${prefix}`
  return `+${cc} (${area}) ${prefix}-${line}`
}

const CartStep = ({ data, stepper }: { data: OrderItemType[]; stepper: StepperType }) => {
  const isCredit = stepper.current.id === 'credit'
  const [street, setStreet] = useState("")
  const [city, setCity] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [zip, setZip] = useState("")
  const [county, setCounty] = useState("")
  const [province, setProvince] = useState("")
  const [country, setCountry] = useState("")
  const [dob, setDob] = useState<Date | undefined>()
  const [dobCalMonth, setDobCalMonth] = useState<Date | undefined>(new Date())
  const [pullType, setPullType] = useState<'hard' | 'soft'>('soft')
  const [includeTU, setIncludeTU] = useState(true)
  const [includeEX, setIncludeEX] = useState(true)
  const [includeEQ, setIncludeEQ] = useState(true)
  const [prevStreet, setPrevStreet] = useState("")
  const [prevCity, setPrevCity] = useState("")
  const [prevState, setPrevState] = useState("")
  const [prevZip, setPrevZip] = useState("")

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
      <div className='flex h-full flex-col gap-6 lg:col-span-2'>
        <div className='flex flex-1 flex-col gap-6 overflow-y-auto pr-2 min-h-[548px] max-h-[90vh]'>
          {isCredit ? (
            <>
              <h3 className='text-sm font-semibold'>Report Order Information</h3>
              <div className='flex flex-col gap-3'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>Pull Type</Label>
                  <div className='flex flex-wrap gap-3'>
                    {[
                      { id: 'hard', label: 'Hard Pull', icon: GiStoneBlock },
                      { id: 'soft', label: 'Soft Pull', icon: FaFeatherAlt },
                    ].map((opt) => {
                      const selected = pullType === opt.id
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.id}
                          type='button'
                          onClick={() => setPullType(opt.id as 'hard' | 'soft')}
                          className={cn(
                            'flex h-full min-h-[130px] w-full max-w-[180px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 text-center shadow-sm transition hover:border-ring hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                            selected ? 'border-ring ring-2 ring-ring' : 'border-input bg-background'
                          )}
                          aria-pressed={selected}
                        >
                          <Icon className='h-8 w-8 text-foreground' aria-hidden='true' />
                          <span className='text-sm font-semibold text-foreground'>{opt.label}</span>
                          <span className='text-xs text-muted-foreground'>
                            {opt.id === 'hard' ? 'Full bureau pull' : 'Soft inquiry'}
                          </span>
                          <span
                            className={cn(
                              'mt-2 inline-flex h-4 w-4 items-center justify-center rounded-full border',
                              selected ? 'border-ring bg-ring/20' : 'border-muted'
                            )}
                          >
                            {selected && <span className='h-2 w-2 rounded-full bg-ring' />}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className='flex w-full flex-wrap items-center gap-4'>
                  <span className='text-xs font-semibold text-muted-foreground'>Include:</span>
                  <label className='flex items-center gap-3 text-sm'>
                    <Checkbox
                      className='h-5 w-5'
                      checked={includeTU}
                      onCheckedChange={(v) => setIncludeTU(!!v)}
                    />
                    <span className='flex-1'>TransUnion</span>
                  </label>
                  <label className='flex items-center gap-3 text-sm'>
                    <Checkbox
                      className='h-5 w-5'
                      checked={includeEX}
                      onCheckedChange={(v) => setIncludeEX(!!v)}
                    />
                    <span className='flex-1'>Experian</span>
                  </label>
                  <label className='flex items-center gap-3 text-sm'>
                    <Checkbox
                      className='h-5 w-5'
                      checked={includeEQ}
                      onCheckedChange={(v) => setIncludeEQ(!!v)}
                    />
                    <span className='flex-1'>Equifax</span>
                  </label>
                </div>
              </div>

              <h3 className='text-sm font-semibold'>Personal Information</h3>
              <div className='flex flex-col gap-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>First Name</Label>
                    <Input placeholder='First Name' />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Last Name</Label>
                    <Input placeholder='Last Name' />
                  </div>
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>SSN</Label>
                    <Input
                      placeholder='123-45-6789'
                      inputMode='numeric'
                      onChange={(e) => {
                        e.target.value = formatSSN(e.target.value)
                      }}
                      maxLength={11}
                    />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>DOB</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className='relative'>
                          <DateInput emptyOnMount value={dob} onChange={setDob} />
                          <span className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground'>
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                              <rect x='3' y='4' width='18' height='18' rx='2' ry='2' stroke='currentColor' />
                              <line x1='16' y1='2' x2='16' y2='6' stroke='currentColor' />
                              <line x1='8' y1='2' x2='8' y2='6' stroke='currentColor' />
                              <line x1='3' y1='10' x2='21' y2='10' stroke='currentColor' />
                            </svg>
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={dob}
                          month={dobCalMonth}
                          onMonthChange={setDobCalMonth}
                          onSelect={(d) => d && setDob(d)}
                          disabled={(d) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return d > today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              <h3 className='text-sm font-semibold'>Current Primary Address</h3>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>Street</Label>
                  <AddressAutocomplete
                    value={street}
                    displayValue='street'
                    placeholder='123 Main St'
                    onChange={(addr) => {
                      setStreet(addr.address_line1 ?? "")
                      setCity(addr.city ?? "")
                      setStateCode((addr.state ?? "").toUpperCase())
                      setZip(addr.zip ?? "")
                    }}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>City</Label>
                    <Input placeholder='City' value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>State</Label>
                    <Select value={stateCode || undefined} onValueChange={setStateCode}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select State' />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Zip Code</Label>
                    <Input placeholder='Zip Code' value={zip} onChange={(e) => setZip(e.target.value)} />
                  </div>
                </div>
              </div>

              <h3 className='text-sm font-semibold'>Previous Address (If less than 2 years)</h3>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>Street</Label>
                  <AddressAutocomplete
                    value={prevStreet}
                    displayValue='street'
                    placeholder='Previous street'
                    onChange={(addr) => {
                      setPrevStreet(addr.address_line1 ?? "")
                      setPrevCity(addr.city ?? "")
                      setPrevState((addr.state ?? "").toUpperCase())
                      setPrevZip(addr.zip ?? "")
                    }}
                  />
                </div>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>City</Label>
                    <Input placeholder='City' value={prevCity} onChange={(e) => setPrevCity(e.target.value)} />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>State</Label>
                    <Select value={prevState || undefined} onValueChange={setPrevState}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select State' />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Zip Code</Label>
                    <Input placeholder='Zip Code' value={prevZip} onChange={(e) => setPrevZip(e.target.value)} />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className='text-sm font-semibold'>Permissible Purpose & Compliance</h3>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>GLB</Label>
                  <Select defaultValue='B'>
                    <SelectTrigger>
                      <SelectValue placeholder='Select GLB' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='B'>B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>DPPA</Label>
                  <Select defaultValue='3'>
                    <SelectTrigger>
                      <SelectValue placeholder='Select DPPA' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='3'>3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>VOTER</Label>
                  <Select defaultValue='7'>
                    <SelectTrigger>
                      <SelectValue placeholder='Select VOTER' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='7'>7</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <h3 className='text-sm font-semibold'>Personal Information</h3>
              <div className='flex flex-col gap-4'>
                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>First Name</Label>
                    <Input placeholder='First Name' />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Middle Initial</Label>
                    <Input placeholder='M' />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Last Name</Label>
                    <Input placeholder='Last Name' />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>DOB</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className='relative'>
                          <DateInput emptyOnMount value={dob} onChange={setDob} />
                          <span className='pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground'>
                            <svg width='16' height='16' viewBox='0 0 24 24' fill='none' aria-hidden='true'>
                              <rect x='3' y='4' width='18' height='18' rx='2' ry='2' stroke='currentColor' />
                              <line x1='16' y1='2' x2='16' y2='6' stroke='currentColor' />
                              <line x1='8' y1='2' x2='8' y2='6' stroke='currentColor' />
                              <line x1='3' y1='10' x2='21' y2='10' stroke='currentColor' />
                            </svg>
                          </span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0' align='start'>
                        <Calendar
                          mode='single'
                          selected={dob}
                          month={dobCalMonth}
                          onMonthChange={setDobCalMonth}
                          onSelect={(d) => d && setDob(d)}
                          disabled={(d) => {
                            const today = new Date()
                            today.setHours(0, 0, 0, 0)
                            return d > today
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>SSN</Label>
                    <Input
                      placeholder='123-45-6789'
                      inputMode='numeric'
                      onChange={(e) => {
                        e.target.value = formatSSN(e.target.value)
                      }}
                      maxLength={11}
                    />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Email Address</Label>
                    <Input type='email' placeholder='email@example.com' />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Phone Number</Label>
                    <Input
                      placeholder='(555) 555-5555'
                      inputMode='tel'
                      onChange={(e) => {
                        e.target.value = formatUSPhone(e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>

              <h3 className='text-sm font-semibold'>Primary Residence</h3>
              <div className='flex flex-col gap-4'>
                <div className='flex flex-col gap-1.5'>
                  <Label className='text-xs font-semibold text-muted-foreground'>Street</Label>
                  <AddressAutocomplete
                    value={street}
                    displayValue='street'
                    placeholder='123 Main St'
                    onChange={(addr) => {
                      setStreet(addr.address_line1 ?? "")
                      setCity(addr.city ?? "")
                      setStateCode((addr.state ?? "").toUpperCase())
                      setProvince((addr.province ?? "").toUpperCase())
                      setCountry((addr.country ?? "").toUpperCase())
                      setZip(addr.zip ?? "")
                      setCounty(addr.county ?? "")
                    }}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>City</Label>
                    <Input placeholder='City' value={city} onChange={(e) => setCity(e.target.value)} />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>State</Label>
                    <Select value={stateCode || undefined} onValueChange={setStateCode}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select State' />
                      </SelectTrigger>
                      <SelectContent>
                        {STATE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Zip Code</Label>
                    <Input placeholder='12345' value={zip} onChange={(e) => setZip(e.target.value)} />
                  </div>
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>County</Label>
                    <Input placeholder='County' value={county} onChange={(e) => setCounty(e.target.value)} />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Province</Label>
                    <Select value={province || undefined} onValueChange={setProvince}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select Province' />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCE_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Country</Label>
                    <Select value={country || undefined} onValueChange={setCountry}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select Country' />
                      </SelectTrigger>
                      <SelectContent>
                        {COUNTRY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <div className='flex h-full flex-col gap-6'>
        <Button className='w-full' onClick={stepper.next}>
          Run
        </Button>
        <ChatPanel className='rounded-md border p-4 flex-1 min-h-[548px]' />
      </div>
    </div>
  )
}

export default CartStep
