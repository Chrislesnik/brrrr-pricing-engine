import {
  BaseEdge,
  type EdgeProps,
  getBezierPath,
  getSimpleBezierPath,
  type InternalNode,
  type Node,
  Position,
  useInternalNode,
} from "@xyflow/react";

const Temporary = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) => {
  const [edgePath] = getSimpleBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      className="stroke-1"
      id={id}
      path={edgePath}
      style={{
        stroke: selected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.5)",
        strokeDasharray: "5, 5",
      }}
    />
  );
};

/**
 * For multi-handle nodes (e.g., Condition with "true"/"false" handles),
 * we need to manually compute the handle Y position since React Flow's
 * default sourceY/targetY only covers the first handle.
 */
const getHandleCoordsByPosition = (
  node: InternalNode<Node>,
  handlePosition: Position,
  handleId: string
): readonly [number, number] | null => {
  const handleType = handlePosition === Position.Left ? "target" : "source";
  const handles = node.internals.handleBounds?.[handleType] || [];
  const handle = handles.find((h) => h.id === handleId);

  if (!handle) {
    return null;
  }

  let offsetX = handle.width / 2;
  let offsetY = handle.height / 2;

  switch (handlePosition) {
    case Position.Left:
      offsetX = 0;
      break;
    case Position.Right:
      offsetX = handle.width;
      break;
    case Position.Top:
      offsetY = 0;
      break;
    case Position.Bottom:
      offsetY = handle.height;
      break;
    default:
      break;
  }

  const x = node.internals.positionAbsolute.x + handle.x + offsetX;
  const y = node.internals.positionAbsolute.y + handle.y + offsetY;

  return [x, y] as const;
};

const Animated = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  style,
  selected,
}: EdgeProps) => {
  // Only look up internal nodes when we have named handles (multi-handle nodes)
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  // Use React Flow's provided coordinates by default (always in sync during drag).
  // Only override for named handles (e.g., Condition "true"/"false") where we
  // need to compute the exact Y position of a specific handle.
  let sx = sourceX;
  let sy = sourceY;
  let sp = sourcePosition;
  let tx = targetX;
  let ty = targetY;
  let tp = targetPosition;

  if (sourceHandleId && sourceNode) {
    const coords = getHandleCoordsByPosition(sourceNode, Position.Right, sourceHandleId);
    if (coords) {
      [sx, sy] = coords;
      sp = Position.Right;
    }
  }

  if (targetHandleId && targetNode) {
    const coords = getHandleCoordsByPosition(targetNode, Position.Left, targetHandleId);
    if (coords) {
      [tx, ty] = coords;
      tp = Position.Left;
    }
  }

  // Skip if coordinates are at origin (handles not measured yet)
  if (sx === 0 && sy === 0 && tx === 0 && ty === 0) {
    return null;
  }

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sp,
    targetX: tx,
    targetY: ty,
    targetPosition: tp,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        ...style,
        stroke: selected ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground) / 0.5)",
        strokeWidth: 2,
        animation: "dashdraw 0.5s linear infinite",
        strokeDasharray: 5,
      }}
    />
  );
};

export const Edge = {
  Temporary,
  Animated,
};
