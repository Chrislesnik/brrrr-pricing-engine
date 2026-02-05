import crypto from "crypto"

function getKey(): Buffer {
	// Preferred: N8N_SSN_KEY (base64-encoded 32 bytes)
	const n8nKey = process.env.N8N_SSN_KEY
	const b64 = n8nKey || process.env.AES_GCM_KEY_B64
	if (b64) {
		try {
			const b = Buffer.from(b64, "base64")
			if (b.length === 32) return b
			throw new Error("N8N_SSN_KEY must decode to 32 bytes (base64)")
		} catch {
			throw new Error("Invalid N8N_SSN_KEY (must be base64-encoded 32 bytes)")
		}
	}
	// Backward compatibility: BORROWER_SSN_ENC_KEY (raw/hex/base64)
	const keyRaw = process.env.BORROWER_SSN_ENC_KEY || ""
	if (!keyRaw) {
		throw new Error("Missing N8N_SSN_KEY (preferred) or BORROWER_SSN_ENC_KEY")
	}
	// Accept raw 32-byte string, hex, or base64
	if (keyRaw.length === 32) {
		return Buffer.from(keyRaw, "utf8")
	}
	if (/^[0-9a-fA-F]+$/.test(keyRaw) && keyRaw.length === 64) {
		return Buffer.from(keyRaw, "hex")
	}
	try {
		const b = Buffer.from(keyRaw, "base64")
		if (b.length === 32) return b
	} catch {}
	throw new Error("Encryption key must be 32 bytes (utf8), 64 hex chars, or base64-encoded 32 bytes")
}

function getAllKeys(): Buffer[] {
	const keys: Buffer[] = []
	// Preferred: N8N_SSN_KEY (then fallback AES_GCM_KEY_B64)
	const aes = process.env.N8N_SSN_KEY || process.env.AES_GCM_KEY_B64
	if (aes) {
		try {
			const b = Buffer.from(aes, "base64")
			if (b.length === 32) keys.push(b)
		} catch {
			// ignore invalid
		}
	}
	// Legacy key
	const legacy = process.env.BORROWER_SSN_ENC_KEY
	if (legacy) {
		if (legacy.length === 32) {
			keys.push(Buffer.from(legacy, "utf8"))
		} else if (/^[0-9a-fA-F]+$/.test(legacy) && legacy.length === 64) {
			keys.push(Buffer.from(legacy, "hex"))
		} else {
			try {
				const b = Buffer.from(legacy, "base64")
				if (b.length === 32) keys.push(b)
			} catch {
				// ignore
			}
		}
	}
	if (keys.length === 0) {
		// Fall back to throwing from getKey to preserve earlier behavior
		keys.push(getKey())
	}
	return keys
}

function encryptPayload(plainText: string): Buffer {
	const key = getKey()
	const iv = crypto.randomBytes(12)
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
	const ciphertext = Buffer.concat([cipher.update(Buffer.from(plainText, "utf8")), cipher.final()])
	const tag = cipher.getAuthTag()
	return Buffer.concat([iv, ciphertext, tag])
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Returns base64 string of iv(12) | ciphertext | tag(16).
 */
export function encryptToBase64(plainText: string): string {
	return encryptPayload(plainText).toString("base64")
}

/**
 * Encrypts plaintext and returns Postgres bytea hex literal string: "\x...".
 */
export function encryptToHex(plainText: string): string {
	const payload = encryptPayload(plainText)
	return "\\x" + payload.toString("hex")
}

/**
 * Encrypts plaintext and returns separate parts for easier interop:
 * - ciphertext_b64: base64 of ciphertext || auth_tag (GCM tag)
 * - iv_b64: base64 of the 12-byte IV
 * - algo: 'AES-256-GCM'
 */
export function encryptToParts(plainText: string): { ciphertext_b64: string; iv_b64: string; algo: string } {
	const key = getKey()
	const iv = crypto.randomBytes(12)
	const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
	const ciphertext = Buffer.concat([cipher.update(Buffer.from(plainText, "utf8")), cipher.final()])
	const tag = cipher.getAuthTag()
	const combined = Buffer.concat([ciphertext, tag]) // consumer will split last 16 bytes for tag if needed
	return {
		ciphertext_b64: combined.toString("base64"),
		iv_b64: iv.toString("base64"),
		algo: "AES-GCM-256",
	}
}

/**
 * Decrypts base64 string of iv(12) | ciphertext | tag(16) to utf8 plaintext.
 */
export function decryptFromBase64(b64: string): string {
	const keys = getAllKeys()
	const payload = Buffer.from(b64, "base64")
	if (payload.length < 12 + 16) throw new Error("Invalid payload")
	const iv = payload.subarray(0, 12)
	const tag = payload.subarray(payload.length - 16)
	const ciphertext = payload.subarray(12, payload.length - 16)
	let lastErr: unknown = null
	for (const key of keys) {
		try {
			const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
			decipher.setAuthTag(tag)
			const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
			return plain.toString("utf8")
		} catch (e) {
			lastErr = e
			continue
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error("Decryption failed with all keys")
}

/**
 * Decrypts when input may be base64 or hex (optionally starting with \"\\x\").
 */
export function decryptFromAny(input: string): string {
	const keys = getAllKeys()
	let payload: Buffer | null = null
	// Try hex with optional \\x prefix
	if (typeof input === "string" && /^\\x[0-9a-fA-F]+$/.test(input)) {
		payload = Buffer.from(input.slice(2), "hex")
	} else if (typeof input === "string" && /^[0-9a-fA-F]+$/.test(input) && input.length >= 56) {
		// bare hex
		payload = Buffer.from(input, "hex")
	} else {
		// fallback to base64
		try {
			payload = Buffer.from(input, "base64")
		} catch {
			// last resort: treat as hex
			try {
				payload = Buffer.from(input.replace(/^\\x/, ""), "hex")
			} catch {
				payload = null
			}
		}
	}
	// Legacy case: bytea hex of ASCII base64 string (hex -> ascii -> base64 -> bytes)
	if (payload && payload.length < 12 + 16) {
		try {
			const ascii = payload.toString("utf8")
			const maybe = Buffer.from(ascii, "base64")
			if (maybe.length >= 12 + 16) payload = maybe
		} catch {
			// ignore
		}
	}
	if (!payload || payload.length < 12 + 16) throw new Error("Invalid payload format")
	const iv = payload.subarray(0, 12)
	const tag = payload.subarray(payload.length - 16)
	const ciphertext = payload.subarray(12, payload.length - 16)
	let lastErr: unknown = null
	for (const key of keys) {
		try {
			const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
			decipher.setAuthTag(tag)
			const plain = Buffer.concat([decipher.update(ciphertext), decipher.final()])
			return plain.toString("utf8")
		} catch (e) {
			lastErr = e
			continue
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error("Decryption failed with all keys")
}


