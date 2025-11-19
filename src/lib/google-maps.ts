// Lightweight loader for Google Maps JavaScript API (Places library)
// Ensures the script is only injected once on the client.
declare global {
	interface GooglePlacesAddressComponent {
		short_name?: string
		long_name?: string
		types?: string[]
	}

	interface GooglePlacesResult {
		address_components?: GooglePlacesAddressComponent[]
		formatted_address?: string
	}

	interface GooglePlacesAutocomplete {
		addListener: (eventName: "place_changed", handler: () => void) => unknown
		getPlace: () => GooglePlacesResult
	}

	interface GoogleMapsPlaces {
		Autocomplete: new (
			input: HTMLInputElement,
			opts?: {
				types?: string[]
				componentRestrictions?: { country: string[] }
				fields?: string[]
			}
		) => GooglePlacesAutocomplete
	}

	interface GoogleMapsEvent {
		removeListener: (listener: unknown) => void
	}

	interface GoogleMapsNamespace {
		places?: GoogleMapsPlaces
		event?: GoogleMapsEvent
	}

	interface Window {
		google?: { maps?: GoogleMapsNamespace }
		__gmapsLoader__?: Promise<void>
	}
}

export async function ensureGoogleMaps(apiKey: string | undefined): Promise<void> {
	if (typeof window === "undefined") return
	if (window.google?.maps?.places) return
	if (!apiKey) throw new Error("Missing Google Maps API key")
	if (window.__gmapsLoader__) return window.__gmapsLoader__

	window.__gmapsLoader__ = new Promise<void>((resolve, reject) => {
		// Avoid adding duplicate script tags
		const existing = document.querySelector<HTMLScriptElement>('script[data-gmaps="1"]')
		if (existing) {
			existing.addEventListener("load", () => resolve())
			existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")))
			return
		}

		const script = document.createElement("script")
		script.async = true
		script.defer = true
		script.dataset.gmaps = "1"
		// Note: restricts to Places library, US region by default
		const params = new URLSearchParams({
			key: apiKey,
			libraries: "places",
			v: "weekly",
			region: "US",
		})
		script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`
		script.onload = () => resolve()
		script.onerror = () => reject(new Error("Google Maps failed to load"))
		document.head.appendChild(script)
	})

	return window.__gmapsLoader__
}


