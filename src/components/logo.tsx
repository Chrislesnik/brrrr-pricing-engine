import Image from "next/image"

export function Logo({
  className = "",
  width = 18,
  height = 18,
}: {
  className?: string
  width?: number
  height?: number
}) {
  return (
    <Image
      src="/pricing-engine-tab-icon.svg"
      width={width}
      height={height}
      className={className}
      alt="Loan Pricing Engine"
    />
  )
}
