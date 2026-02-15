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

const getHandleCoordsByPosition = (
  node: InternalNode<Node>,
  handlePosition: Position,
  handleId?: string | null
): readonly [number, number] | null => {
  // Choose the handle type based on position - Left is for target, Right is for source
  const handleType = handlePosition === Position.Left ? "target" : "source";

  // Find handle by ID if provided, otherwise by position
  const handles = node.internals.handleBounds?.[handleType] || [];
  const handle = handleId
    ? handles.find((h) => h.id === handleId) || handles.find((h) => h.position === handlePosition)
    : handles.find((h) => h.position === handlePosition);

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
      throw new Error(`Invalid handle position: ${handlePosition}`);
  }

  const x = node.internals.positionAbsolute.x + handle.x + offsetX;
  const y = node.internals.positionAbsolute.y + handle.y + offsetY;

  return [x, y] as const;
};

const getEdgeParams = (
  source: InternalNode<Node>,
  target: InternalNode<Node>,
  sourceHandleId?: string | null,
  targetHandleId?: string | null
) => {
  const sourcePos = Position.Right;
  const sourceCoords = getHandleCoordsByPosition(source, sourcePos, sourceHandleId);
  const targetPos = Position.Left;
  const targetCoords = getHandleCoordsByPosition(target, targetPos, targetHandleId);

  // If either handle is missing (not measured yet), signal to skip rendering
  if (!sourceCoords || !targetCoords) {
    return null;
  }

  return {
    sx: sourceCoords[0],
    sy: sourceCoords[1],
    tx: targetCoords[0],
    ty: targetCoords[1],
    sourcePos,
    targetPos,
  };
};

const Animated = ({ id, source, target, sourceHandleId, targetHandleId, style, selected }: EdgeProps) => {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!(sourceNode && targetNode)) {
    return null;
  }

  const edgeParams = getEdgeParams(
    sourceNode,
    targetNode,
    sourceHandleId,
    targetHandleId
  );

  // Skip rendering if handles aren't measured yet (prevents lines to 0,0)
  if (!edgeParams) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = edgeParams;

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetX: tx,
    targetY: ty,
    targetPosition: targetPos,
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
