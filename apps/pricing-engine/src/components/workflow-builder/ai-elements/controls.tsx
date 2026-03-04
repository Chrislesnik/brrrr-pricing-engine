"use client";

import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize2, MapPin, MapPinXInside, Hand, MousePointer2, Paintbrush } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";
import { Button } from "@repo/ui/shadcn/button";
import { ButtonGroup } from "@/components/workflow-builder/ui/button-group";
import { getLayoutedElements } from "@/components/workflow-builder/lib/auto-layout";
import {
  showMinimapAtom,
  panOnDragAtom,
  nodesAtom,
  edgesAtom,
  hasUnsavedChangesAtom,
} from "@/components/workflow-builder/lib/workflow-store";

export const Controls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [showMinimap, setShowMinimap] = useAtom(showMinimapAtom);
  const [panOnDrag, setPanOnDrag] = useAtom(panOnDragAtom);
  const [nodes, setNodes] = useAtom(nodesAtom);
  const [edges] = useAtom(edgesAtom);
  const setHasUnsavedChanges = useSetAtom(hasUnsavedChangesAtom);

  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
  };

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleToggleMinimap = () => {
    setShowMinimap(!showMinimap);
  };

  const handleTogglePanMode = () => {
    setPanOnDrag(!panOnDrag);
  };

  const handleCleanUp = useCallback(() => {
    const layoutedNodes = getLayoutedElements(nodes, edges);
    setNodes(layoutedNodes);
    setHasUnsavedChanges(true);
    setTimeout(() => {
      fitView({ padding: 0.2, duration: 300 });
    }, 0);
  }, [nodes, edges, setNodes, setHasUnsavedChanges, fitView]);

  return (
    <ButtonGroup orientation="vertical">
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleZoomIn}
        size="icon"
        title="Zoom in"
        variant="secondary"
      >
        <ZoomIn className="size-4" />
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleZoomOut}
        size="icon"
        title="Zoom out"
        variant="secondary"
      >
        <ZoomOut className="size-4" />
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleFitView}
        size="icon"
        title="Fit view"
        variant="secondary"
      >
        <Maximize2 className="size-4" />
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleTogglePanMode}
        size="icon"
        title={panOnDrag ? "Switch to pointer mode (scroll to pan)" : "Switch to grab mode (drag to pan)"}
        variant="secondary"
      >
        {panOnDrag ? (
          <Hand className="size-4" />
        ) : (
          <MousePointer2 className="size-4" />
        )}
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleToggleMinimap}
        size="icon"
        title={showMinimap ? "Hide minimap" : "Show minimap"}
        variant="secondary"
      >
        {showMinimap ? (
          <MapPin className="size-4" />
        ) : (
          <MapPinXInside className="size-4" />
        )}
      </Button>
      <Button
        className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
        onClick={handleCleanUp}
        size="icon"
        title="Clean up layout"
        variant="secondary"
      >
        <Paintbrush className="size-4" />
      </Button>
    </ButtonGroup>
  );
};
