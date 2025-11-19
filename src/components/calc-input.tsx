import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface Props extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
	id?: string
	value: string
	onValueChange: (next: string) => void
	className?: string
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

export function CalcInput({ id, value, onValueChange, className, ...rest }: Props) {
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
			// eslint-disable-next-line no-new-func
			const result = Function(`"use strict"; return (${trimmed});`)()
			if (typeof result === "number" && Number.isFinite(result)) {
				onValueChange(String(result))
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
			value={calcMode ? `=${expr}` : value}
			onChange={(e) => {
				if (!calcMode) {
					onValueChange(e.target.value)
					return
				}
				const v = e.target.value
				// Leaving calc mode if '=' removed
				if (!v.startsWith("=")) {
					setCalcMode(false)
					setExpr("")
					onValueChange(v)
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
			className={cn(
				calcMode
					? "ring-2 ring-purple-500/60 border-purple-500/70 focus-visible:ring-purple-500"
					: "",
				className
			)}
			inputMode="decimal"
			{...rest}
		/>
	)
}


