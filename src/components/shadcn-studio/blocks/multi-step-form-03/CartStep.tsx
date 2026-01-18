"use client"

import { useEffect, useMemo, useState } from 'react'

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddressAutocomplete } from '@/components/address-autocomplete'
import { ChatPanel } from '@/components/ai/chat-panel'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { isUuid } from '@/lib/uuid'
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

type ReportDoc = { id: string; name: string; created_at: string; status: string | null; url: string }

const CartStep = ({ data, stepper, currentBorrowerId }: { data: OrderItemType[]; stepper: StepperType; currentBorrowerId?: string }) => {
  const isCredit = stepper.current.id === 'credit'
  const { toast } = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
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
  // Credit report files for the currently selected borrower (Credit step)
  const [files, setFiles] = useState<ReportDoc[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState<string | undefined>(undefined)

  // Auto-select the first file when list loads and nothing is selected
  useEffect(() => {
    const first = files.find((f) => isUuid(f.id?.trim?.() ?? f.id))?.id
    const stillValid = selectedReportId && files.some((f) => f.id === selectedReportId)
    if (first && !stillValid) {
      setSelectedReportId(first.trim())
    } else if (!first) {
      setSelectedReportId(undefined)
    }
    // only run when files list changes
    // eslint-disable-next-line react-hooks/exhaustive-comments
  }, [files])

  // Normalize the report id we will actually use for chat requests:
  // - Prefer the selected item when it exists in the current files list
  // - Otherwise fall back to the first valid UUID from the list
  const effectiveReportId = useMemo(() => {
    const normalized = selectedReportId?.trim()
    if (isUuid(normalized)) return normalized
    return files.find((f) => isUuid(f.id?.trim?.() ?? f.id))?.id?.trim()
  }, [files, selectedReportId])
  useEffect(() => {
    let ignore = false
    async function load() {
      if (!currentBorrowerId || stepper.current.id !== 'credit') {
        setFiles([])
        return
      }
      try {
        setFilesLoading(true)
        const res = await fetch(`/api/credit-reports?borrowerId=${encodeURIComponent(currentBorrowerId)}`, { cache: 'no-store' })
        const j = await res.json().catch(() => ({ documents: [] }))
        if (!ignore) {
          setFiles(Array.isArray(j?.documents) ? j.documents : [])
        }
      } catch {
        if (!ignore) setFiles([])
      } finally {
        if (!ignore) setFilesLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [currentBorrowerId, stepper.current.id])

  // Prefill borrower data on Credit step
  useEffect(() => {
    let ignore = false
    async function loadBorrower() {
      // When on Credit tab but there is no borrower id, clear fields
      if (stepper.current.id === 'credit' && !currentBorrowerId) {
        setFirstName("")
        setLastName("")
        setSsn("")
        setDob(undefined)
        setStreet("")
        setCity("")
        setStateCode("")
        setZip("")
        setCounty("")
        return
      }
      // If we have some id string, attempt fetch; server will 404 when not found
      if (!currentBorrowerId || stepper.current.id !== 'credit') return
      // Optimistically clear before fetching to avoid stale values while switching
      setFirstName("")
      setLastName("")
      setSsn("")
      setDob(undefined)
      setStreet("")
      setCity("")
      setStateCode("")
      setZip("")
      setCounty("")
      try {
        const res = await fetch(`/api/borrowers/${encodeURIComponent(currentBorrowerId)}`, { cache: 'no-store' })
        if (!res.ok) {
          // Nothing to populate (404/401 etc.) — keep cleared values
          return
        }
        const j = await res.json().catch(() => ({}))
        const b = j?.borrower
        if (!ignore && b) {
          setFirstName((b.first_name as string) ?? "")
          setLastName((b.last_name as string) ?? "")
          // DOB
          if (b.date_of_birth) {
            const s = String(b.date_of_birth as string)
            const m = /^([0-9]{4})-(\d{2})-(\d{2})$/.exec(s)
            if (m) {
              const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3])
              const local = new Date(y, mo - 1, d)
              if (!Number.isNaN(local.getTime())) setDob(local)
            }
          }
          setStreet((b.address_line1 as string) ?? "")
          setCity((b.city as string) ?? "")
          setStateCode((b.state as string) ?? "")
          setZip((b.zip as string) ?? "")
          setCounty((b.county as string) ?? "")
        }
        // Attempt to load full decrypted SSN using the same endpoint as the Borrower Settings modal
        try {
          const sres = await fetch(`/api/applicants/borrowers/${encodeURIComponent(currentBorrowerId)}/ssn`, { cache: 'no-store' })
          if (sres.ok) {
            const sj = await sres.json().catch(() => ({} as any))
            const digits = String(sj?.ssn ?? '').replace(/\D+/g, '').slice(0, 9)
            if (digits.length === 9 && !ignore) {
              setSsn(formatSSN(digits))
              return
            }
          }
        } catch {
          // ignore and fall back to last4
        }
        // Fallback: mask with last4 if available
        if (!ignore && typeof j?.borrower?.ssn_last4 === 'string' && j.borrower.ssn_last4.length === 4) {
          setSsn(`***-**-${j.borrower.ssn_last4}`)
        }
      } catch {
        // swallow
      }
    }
    loadBorrower()
    return () => { ignore = true }
  }, [currentBorrowerId, stepper.current.id])

  const [prevStreet, setPrevStreet] = useState("")
  const [prevCity, setPrevCity] = useState("")
  const [prevState, setPrevState] = useState("")
  const [prevZip, setPrevZip] = useState("")
  const [ssn, setSsn] = useState("")
  const [isRunning, setIsRunning] = useState(false)

  async function handleRun() {
    if (!isCredit) return
    try {
      setIsRunning(true)
      const digits = ssn.replace(/\D+/g, "").slice(0, 9)
      const inputs = {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        ssn: digits || undefined,
        date_of_birth: (() => {
          if (!dob) return undefined
          const y = dob.getFullYear()
          const m = String(dob.getMonth() + 1).padStart(2, "0")
          const d = String(dob.getDate()).padStart(2, "0")
          return `${y}-${m}-${d}`
        })(),
        address_line1: street || undefined,
        city: city || undefined,
        state: stateCode || undefined,
        zip: zip || undefined,
        county: county || undefined,
        include_transunion: includeTU,
        include_experian: includeEX,
        include_equifax: includeEQ,
        pull_type: pullType,
      }
      const res = await fetch("/api/credit/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          borrowerId: currentBorrowerId ?? null,
          inputs,
          aggregator: null,
        }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok || j?.ok === false) {
        throw new Error(j?.error || `Webhook failed (status ${j?.status ?? res.status})`)
      }
      toast({ title: "Credit run dispatched", description: "Webhook received the payload." })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to run credit dispatch"
      toast({ title: "Credit run failed", description: msg })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className='grid grid-cols-1 gap-6 lg:grid-cols-3 flex-1 min-h-0 overflow-hidden' key={stepper.current.id}>
      <div className='flex h-full min-h-0 flex-col gap-6 lg:col-span-2'>
        <div className='flex flex-1 min-h-0 flex-col gap-6 overflow-auto pr-2'>
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
                  <Input placeholder='First Name' value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>Last Name</Label>
                  <Input placeholder='Last Name' value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='flex flex-col gap-1.5'>
                    <Label className='text-xs font-semibold text-muted-foreground'>SSN</Label>
                    <Input
                      placeholder='123-45-6789'
                      inputMode='numeric'
                      value={ssn}
                      onChange={(e) => {
                        const next = formatSSN(e.target.value)
                        setSsn(next)
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
        <div className='flex w-full items-center gap-2'>
          <Button className='h-9 px-4 py-2' onClick={handleRun} disabled={isRunning}>
            Run
          </Button>
          <Select
            onValueChange={(val) => {
              const next = val?.trim?.() ?? val
              const normalized = isUuid(next) ? next : undefined
              if (next) {
                setSelectedReportId(normalized)
              }
              // no automatic open; selection only
            }}
            value={selectedReportId}
            disabled={filesLoading || files.length === 0}
          >
            <SelectTrigger className='h-9 min-w-[180px]'>
              <SelectValue
                placeholder={filesLoading ? 'Loading…' : files.length ? 'Files' : 'No files'}
              />
            </SelectTrigger>
            <SelectContent className='data-[state=open]:!zoom-in-0 origin-center duration-400'>
              {files.length > 0 ? (
                <SelectGroup>
                  <SelectLabel>Files</SelectLabel>
                  {files.map(f => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ) : null}
            </SelectContent>
          </Select>
        </div>
        {effectiveReportId ? (
          <ChatPanel
            key={effectiveReportId}
            className='rounded-md border p-4 flex-1 h-full min-h-0 overflow-auto'
            reportId={effectiveReportId}
          />
        ) : (
          <div className='rounded-md border p-4 text-sm text-muted-foreground'>
            Select a report to load chat.
          </div>
        )}
      </div>
    </div>
  )
}

export default CartStep
