"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { ensureGoogleMaps } from "@/lib/google-maps"
import { IconMapPin } from "@tabler/icons-react"

type Address = {
	address_line1?: string
	address_line2?: string
	city?: string
	state?: string
	zip?: string
	county?: string
	province?: string
	country?: string
}

type PlacePrediction = {
	place_id: string
	description?: string
	structured_formatting?: {
		main_text?: string
		secondary_text?: string
	}
}

export function AddressAutocomplete({
	value,
	onChange,
	placeholder,
	id,
	className,
	displayValue = "full",
}: {
	value?: string
	onChange: (addr: Address & { raw: string }) => void
	placeholder?: string
	id?: string
	className?: string
	displayValue?: "full" | "street"
}) {
	const inputRef = useRef<HTMLInputElement | null>(null)
	const menuRef = useRef<HTMLDivElement | null>(null)
	const pointerInMenuRef = useRef(false)
	const suppressFetchRef = useRef(false)
	const typingRef = useRef(false)
	const [gmapsReady, setGmapsReady] = useState(false)
	const [text, setText] = useState<string>(value ?? "")
	const [predictions, setPredictions] = useState<PlacePrediction[]>([])
	const [show, setShow] = useState(false)
	const [activeIdx, setActiveIdx] = useState(-1)
	const sessionTokenRef = useRef<any>(null)

	// Keep internal text synced if parent passes a value
	useEffect(() => {
		if (value !== undefined) {
			setText(value)
			// External changes shouldn't auto-open suggestions
			setShow(false)
		}
	}, [value])

	// Load Maps JS and create a session token
	useEffect(() => {
		let mounted = true
		;(async () => {
			const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined
			await ensureGoogleMaps(apiKey)
			if (!mounted) return
			const win = window as unknown as { google?: { maps?: { places?: any } } }
			if (win.google?.maps?.places) {
				setGmapsReady(true)
				// new token each mount
				sessionTokenRef.current = new win.google.maps.places.AutocompleteSessionToken()
			}
		})()
		return () => {
			mounted = false
		}
	}, [])

	// Fetch predictions as user types
	useEffect(() => {
		// Skip one cycle immediately after selecting a prediction
		if (suppressFetchRef.current) {
			suppressFetchRef.current = false
			return
		}
		if (!gmapsReady) return
		const q = text.trim()
		if (!q) {
			setPredictions([])
			setShow(false)
			return
		}
		const win = window as unknown as { google?: { maps?: { places?: any } } }
		const places = win.google?.maps?.places
		if (!places) return
		const svc = new places.AutocompleteService()
		const req = {
			input: q,
			types: ["address"],
			componentRestrictions: { country: ["us", "ca"] },
			sessionToken: sessionTokenRef.current,
		}
		let cancelled = false
		svc.getPlacePredictions(req, (res: PlacePrediction[] | null, status: string) => {
			if (cancelled) return
			const ok = status === "OK" || status === "ZERO_RESULTS"
			if (!ok || !res) {
				setPredictions([])
				setShow(false)
				return
			}
			setPredictions(res)
			// Only open when the user is actively typing
			setShow(typingRef.current)
			setActiveIdx(-1)
		})
		return () => {
			cancelled = true
		}
	}, [text, gmapsReady])

	function parseComponents(comps: Array<{ long_name?: string; short_name?: string; types?: string[] }>) {
		const getLong = (type: string) => comps.find((c) => (c.types ?? []).includes(type))?.long_name ?? ""
		const getShort = (type: string) => comps.find((c) => (c.types ?? []).includes(type))?.short_name ?? ""
		const streetNumber = getLong("street_number")
		const route = getLong("route")
		const city = getLong("locality") || getLong("sublocality") || getLong("postal_town")
		// Use the 2-letter state/province short code so selects can auto-populate
		const admin1Short = getShort("administrative_area_level_1")
		const admin1Long = getLong("administrative_area_level_1")
		const state = admin1Short || admin1Long
		const province = admin1Short || admin1Long
		const zip = getLong("postal_code")
		const county = getLong("administrative_area_level_2")
		const country = getShort("country") || getLong("country")
		return {
			address_line1: [streetNumber, route].filter(Boolean).join(" "),
			address_line2: "",
			city,
			state,
			zip,
			county,
			province,
			country,
		}
	}

	function applyPlaceById(placeId: string) {
		const win = window as unknown as { google?: { maps?: { places?: any } } }
		const places = win.google?.maps?.places
		if (!places) return
		// PlacesService requires an element
		const svc = new places.PlacesService(document.createElement("div"))
		svc.getDetails(
			{ placeId, fields: ["address_components", "formatted_address"], sessionToken: sessionTokenRef.current },
			(place: { address_components?: any[]; formatted_address?: string } | null, status: string) => {
				const ok = status === "OK"
				if (!ok || !place) return
				const raw = place.formatted_address ?? text
				const fields = parseComponents(place.address_components ?? [])
				// Prevent immediate refetch from the setText below
				suppressFetchRef.current = true
				setText(displayValue === "street" ? (fields.address_line1 ?? raw) : raw)
				setShow(false)
				setPredictions([])
				onChange({ raw, ...fields })
			},
		)
	}

	return (
		<div className="relative">
			<Input
				id={id}
				ref={inputRef}
				value={text}
				onChange={(e) => {
					typingRef.current = true
					setText(e.target.value)
				}}
				onKeyDown={(e) => {
					if (!show || predictions.length === 0) return
					if (e.key === "ArrowDown") {
						e.preventDefault()
						setActiveIdx((idx) => Math.min(idx + 1, predictions.length - 1))
					} else if (e.key === "ArrowUp") {
						e.preventDefault()
						setActiveIdx((idx) => Math.max(idx - 1, 0))
					} else if (e.key === "Enter") {
						if (activeIdx >= 0) {
							e.preventDefault()
							const p = predictions[activeIdx]
							applyPlaceById(p.place_id)
						}
					} else if (e.key === "Escape") {
						setShow(false)
					}
				}}
				onBlur={() => {
					setTimeout(() => {
						typingRef.current = false
						if (!pointerInMenuRef.current) setShow(false)
					}, 0)
				}}
				placeholder={placeholder ?? "Start typing your address..."}
				className={className}
				autoComplete="off"
			/>
			{show && predictions.length > 0 && (
				<div
					ref={menuRef}
					className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-background shadow"
					role="listbox"
					onMouseDown={() => (pointerInMenuRef.current = true)}
					onMouseUp={() => (pointerInMenuRef.current = false)}
				>
					{predictions.map((p, idx) => (
						<button
							key={p.place_id}
							type="button"
							className={`flex w-full items-start gap-2 px-2 py-2 text-left hover:bg-accent ${
								idx === activeIdx ? "bg-accent" : ""
							}`}
							onMouseEnter={() => setActiveIdx(idx)}
							onClick={() => applyPlaceById(p.place_id)}
						>
							<IconMapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
							<div className="flex min-w-0 flex-col">
								<span className="truncate text-sm font-medium">
									{p.structured_formatting?.main_text ?? p.description}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{p.structured_formatting?.secondary_text ?? ""}
								</span>
							</div>
						</button>
					))}
					<div className="border-t px-2 py-1 text-right text-[10px] uppercase tracking-wide text-muted-foreground">
						Powered by Google
					</div>
				</div>
			)}
		</div>
	)
}

