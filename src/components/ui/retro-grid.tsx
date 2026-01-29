"use client"


import { cn } from "@/lib/utils"

export interface RetroGridProps {
  /** Additional CSS classes */
  className?: string
  /** Content to render on top of the grid */
  children?: React.ReactNode
  /** Rotation angle of the grid in degrees */
  angle?: number
  /** Grid cell size in pixels */
  cellSize?: number
  /** Grid opacity value between 0 and 1 */
  opacity?: number
  /** Grid line color */
  lineColor?: string
}

export function RetroGrid({
  className,
  children,
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lineColor = "#4b5563",
}: RetroGridProps) {
  return (
    <div className={cn("fixed inset-0 overflow-hidden bg-neutral-950", className)}>
      {/* Keyframe animation */}
      <style>{`
        @keyframes retro-grid-scroll {
          0% {
            transform: translateY(-50%);
          }
          100% {
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Perspective container */}
      <div
        className="pointer-events-none absolute inset-0 [perspective:200px]"
        style={{ opacity }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `rotateX(${angle}deg)` }}
        >
          <div
            style={{
              backgroundImage: `linear-gradient(to right, ${lineColor} 1px, transparent 0), linear-gradient(to bottom, ${lineColor} 1px, transparent 0)`,
              backgroundSize: `${cellSize}px ${cellSize}px`,
              backgroundRepeat: "repeat",
              height: "300vh",
              width: "600vw",
              marginLeft: "-200%",
              transformOrigin: "100% 0 0",
              animation: "retro-grid-scroll 15s linear infinite",
            }}
          />
        </div>

        {/* Horizon fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 to-transparent to-90%" />
      </div>

      {/* Content layer */}
      {children && (
        <div className="relative z-10 h-full w-full">{children}</div>
      )}
    </div>
  )
}

export default function RetroGridDemo() {
  return <RetroGrid />
}
