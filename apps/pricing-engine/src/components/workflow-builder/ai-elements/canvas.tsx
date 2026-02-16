import { ReactFlow, type ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";
import "@xyflow/react/dist/style.css";

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

export const Canvas = ({ children, ...props }: CanvasProps) => {
  return (
    <ReactFlow
      deleteKeyCode={["Backspace", "Delete"]}
      fitView
      minZoom={0.1}
      panActivationKeyCode={null}
      selectionOnDrag={false}
      zoomOnDoubleClick={false}
      zoomOnPinch
      {...props}
    >
      {children}
    </ReactFlow>
  );
};
