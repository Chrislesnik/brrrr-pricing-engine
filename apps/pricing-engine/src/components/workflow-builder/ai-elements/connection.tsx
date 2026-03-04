import type { ConnectionLineComponent } from "@xyflow/react";

const HALF = 0.5;

export const Connection: ConnectionLineComponent = ({
  fromX,
  fromY,
  toX,
  toY,
}) => (
  <g>
    <path
      d={`M${fromX},${fromY} C ${fromX + (toX - fromX) * HALF},${fromY} ${fromX + (toX - fromX) * HALF},${toY} ${toX},${toY}`}
      fill="none"
      stroke="hsl(var(--muted-foreground))"
      strokeWidth={2}
      strokeDasharray="6, 4"
    />
    <circle
      cx={toX}
      cy={toY}
      fill="hsl(var(--background))"
      r={4}
      stroke="hsl(var(--muted-foreground))"
      strokeWidth={2}
    />
  </g>
);
