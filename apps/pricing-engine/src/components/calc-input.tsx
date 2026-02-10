import * as React from "react"
import { cn } from "@repo/lib/cn"
import { Input } from "@repo/ui/shadcn/input"

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
	id?: string
	value: string
	onValueChange: (next: string) => void
	className?: string
	highlighted?: boolean
}

function isSafeExpression(expression: string): boolean {
	// Only allow digits, decimal points, operators, whitespace, and parentheses
	if (!/^[0-9+\-*/().\s]*$/.test(expression)) return false
	// Basic parentheses balance check
	let depth = 0
	for (const ch of expression) {
		if (ch === "(") depth++
		else if (ch === ")") {
			depth--
			if (depth < 0) return false
		}
	}
	return depth === 0 && expression.trim().length > 0
}

// Normalize a user-typed currency string to a raw numeric string without commas,
// with an optional single decimal point and at most two fractional digits.
function sanitizeCurrencyRaw(input: string): string {
	// Strip everything except digits and dots
	const only = input.replace(/[^0-9.]/g, "")
	if (only === "") return ""
	// Keep first dot only
	const firstDot = only.indexOf(".")
	const trailingDot = firstDot !== -1 && only.endsWith(".")
	let intPart = ""
	let decPart = ""
	if (firstDot === -1) {
		intPart = only
	} else {
		intPart = only.slice(0, firstDot)
		decPart = only.slice(firstDot + 1).replace(/\./g, "")
	}
	// Remove leading zeros in integer part (but keep single zero if decimals exist or if all zeros)
	intPart = intPart.replace(/^0+(?=\d)/, "")
	// Limit decimals to 2
	if (decPart.length > 2) decPart = decPart.slice(0, 2)
	// Recombine
	if (decPart.length > 0) return `${intPart || "0"}.${decPart}`
	// Preserve a trailing '.' while typing (e.g., "123."), allow starting with "."
	if (trailingDot) return `${intPart || "0"}.`
	return intPart
}

function formatWithCommas(raw: string): string {
	if (!raw) return ""
	const [i, d] = raw.split(".")
	// Insert commas in integer part
	const withCommas = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	return d !== undefined ? `${withCommas}.${d}` : withCommas
}

export function CalcInput({ id, value, onValueChange, className, highlighted, ...rest }: Props) {
	const [calcMode, setCalcMode] = React.useState<boolean>(false)
	const [expr, setExpr] = React.useState<string>("")

	// Sync exit of calc mode if external value changes while not in calc mode
	React.useEffect(() => {
		if (!calcMode) setExpr("")
	}, [value, calcMode])

	function resolveExpression() {
		const trimmed = expr.trim()
		if (!isSafeExpression(trimmed)) return
		try {
			const result = Function(`"use strict"; return (${trimmed});`)()
			if (typeof result === "number" && Number.isFinite(result)) {
				// Store as raw currency with max 2 decimals
				const normalized = sanitizeCurrencyRaw(String(result))
				onValueChange(normalized)
				setCalcMode(false)
				setExpr("")
			}
		} catch {
			// silently ignore invalid expressions
		}
	}

	return (
		<Input
			id={id}
			value={calcMode ? `=${expr}` : formatWithCommas(value)}
			onChange={(e) => {
				if (!calcMode) {
					const raw = sanitizeCurrencyRaw(e.target.value)
					onValueChange(raw)
					return
				}
				const v = e.target.value
				// Leaving calc mode if '=' removed
				if (!v.startsWith("=")) {
					setCalcMode(false)
					setExpr("")
					const raw = sanitizeCurrencyRaw(v)
					onValueChange(raw)
				} else {
					setExpr(v.slice(1))
				}
			}}
			onKeyDown={(e) => {
				if (!calcMode && e.key === "=") {
					e.preventDefault()
					setCalcMode(true)
					setExpr("")
					return
				}
				if (calcMode && (e.key === "Enter" || e.key === "Return")) {
					e.preventDefault()
					resolveExpression()
				}
				if (calcMode && e.key === "Escape") {
					e.preventDefault()
					setCalcMode(false)
					setExpr("")
				}
			}}
			onBlur={() => {
				if (calcMode) return
				if (!value) return
				// Ensure we clamp to 2 decimals on blur, padding if needed
				const num = Number(value)
				if (!Number.isNaN(num) && Number.isFinite(num)) {
					const fixed = num.toFixed(2)
					onValueChange(sanitizeCurrencyRaw(fixed))
				}
			}}
			className={cn(
				// Remove ring on normal focus, only show ring for calc mode or highlighted
				!calcMode && !highlighted ? "focus-visible:ring-0 focus-visible:border-neutral-400" : "",
			calcMode
				? "ring-2 ring-purple-500/60 border-purple-500/70 focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500/70"
				: "",
				!calcMode && highlighted ? "ring-1 ring-warning border-warning" : "",
				className
			)}
			inputMode="decimal"
			pattern="^[0-9]*\\.?[0-9]{0,2}$"
			aria-label="Currency amount"
			{...rest}
		/>
	)
}


