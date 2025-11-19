// Lightweight loader for Google Maps JavaScript API (Places library)
// Ensures the script is only injected once on the client.
declare global {
	interface Window {
		google?: any
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


