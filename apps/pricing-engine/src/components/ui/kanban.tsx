"use client";

import {
  closestCenter,
  closestCorners,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimationSideEffects,
  getFirstCollision,
  KeyboardSensor,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Slot } from "@radix-ui/react-slot";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { cn } from "@repo/lib/cn";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface KanbanContextValue<T> {
  columns: Record<string, T[]>;
  activeId: UniqueIdentifier | null;
  activeType: "column" | "item" | null;
  getItemValue: (item: T) => UniqueIdentifier;
}

const KanbanContext = React.createContext<KanbanContextValue<unknown> | null>(
  null,
);

function useKanbanContext() {
  const ctx = React.useContext(KanbanContext);
  if (!ctx) throw new Error("`Kanban*` components must be used within `Kanban`");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Custom collision detection                                                 */
/* -------------------------------------------------------------------------- */

/**
 * When dragging a column, only consider other columns as drop targets.
 * When dragging an item, use pointerWithin first (for cross-column), then closestCenter.
 */
function createTypeAwareCollision(
  activeTypeRef: React.RefObject<"column" | "item" | null>,
): CollisionDetection {
  return (args) => {
    const activeType = activeTypeRef.current;

    if (activeType === "column") {
      // Only consider droppables that are columns
      const columnEntries = args.droppableContainers.filter(
        (container) => container.data.current?.type === "column",
      );
      return closestCenter({
        ...args,
        droppableContainers: columnEntries,
      });
    }

    // For items: use pointerWithin first to detect which column we're in,
    // then closestCenter for fine positioning among items
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
      return pointerCollisions;
    }
    return closestCorners(args);
  };
}

/* -------------------------------------------------------------------------- */
/*  Kanban (root)                                                              */
/* -------------------------------------------------------------------------- */

interface KanbanProps<T> {
  value: Record<string, T[]>;
  onValueChange: (value: Record<string, T[]>) => void;
  getItemValue: (item: T) => UniqueIdentifier;
  children: React.ReactNode;
  onColumnMove?: (activeColumn: string, overColumn: string) => void;
  onItemMove?: (
    itemId: UniqueIdentifier,
    fromColumn: string,
    toColumn: string,
    newIndex: number,
  ) => void;
}

function findColumnOfItem<T>(
  columns: Record<string, T[]>,
  id: UniqueIdentifier,
  getItemValue: (item: T) => UniqueIdentifier,
): string | null {
  for (const [col, items] of Object.entries(columns)) {
    if (items.some((item) => getItemValue(item) === id)) return col;
  }
  return null;
}

function Kanban<T>({
  value,
  onValueChange,
  getItemValue,
  children,
  onColumnMove,
  onItemMove,
}: KanbanProps<T>) {
  const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null);
  const activeTypeRef = React.useRef<"column" | "item" | null>(null);
  const [activeType, setActiveType] = React.useState<"column" | "item" | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnKeys = React.useMemo(() => Object.keys(value), [value]);

  const collisionDetection = React.useMemo(
    () => createTypeAwareCollision(activeTypeRef),
    [],
  );

  const onDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const type = (active.data.current?.type as string) === "column" ? "column" : "item";
      activeTypeRef.current = type;
      setActiveType(type);
      setActiveId(active.id);
    },
    [],
  );

  const onDragOver = React.useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      // Only handle cross-column item moves during dragOver
      if (activeTypeRef.current === "column") return;

      const activeCol = findColumnOfItem(value, active.id, getItemValue);
      let overCol: string | null = null;

      if (over.data.current?.type === "column") {
        overCol = over.id as string;
      } else {
        overCol = findColumnOfItem(value, over.id, getItemValue);
      }

      if (!activeCol || !overCol || activeCol === overCol) return;

      const activeItem = value[activeCol]!.find(
        (item) => getItemValue(item) === active.id,
      );
      if (!activeItem) return;

      onValueChange({
        ...value,
        [activeCol]: value[activeCol]!.filter(
          (item) => getItemValue(item) !== active.id,
        ),
        [overCol]: [...value[overCol]!, activeItem],
      });
    },
    [value, onValueChange, getItemValue],
  );

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      const currentActiveType = activeTypeRef.current;
      setActiveId(null);
      setActiveType(null);
      activeTypeRef.current = null;

      if (!over) return;

      if (currentActiveType === "column") {
        // Column reorder — over is guaranteed to be a column thanks to collision detection
        const overColKey = over.id as string;
        if (active.id === overColKey) return;

        const oldIndex = columnKeys.indexOf(active.id as string);
        const newIndex = columnKeys.indexOf(overColKey);
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(columnKeys, oldIndex, newIndex);
          const reordered: Record<string, T[]> = {};
          for (const key of newOrder) {
            reordered[key] = value[key]!;
          }
          onValueChange(reordered);
          onColumnMove?.(active.id as string, overColKey);
        }
        return;
      }

      // Item drag end — reorder within same column
      const activeCol = findColumnOfItem(value, active.id, getItemValue);
      let overCol: string | null = null;

      if (over.data.current?.type === "column") {
        overCol = over.id as string;
      } else {
        overCol = findColumnOfItem(value, over.id, getItemValue);
      }

      if (!activeCol || !overCol) return;

      if (activeCol === overCol) {
        const items = value[activeCol]!;
        const oldIndex = items.findIndex(
          (item) => getItemValue(item) === active.id,
        );
        const newIndex = items.findIndex(
          (item) => getItemValue(item) === over.id,
        );

        if (oldIndex !== newIndex && newIndex !== -1) {
          onValueChange({
            ...value,
            [activeCol]: arrayMove(items, oldIndex, newIndex),
          });
        }
        onItemMove?.(active.id, activeCol, overCol, newIndex === -1 ? oldIndex : newIndex);
      } else {
        const overItems = value[overCol]!;
        const newIndex = overItems.findIndex(
          (item) => getItemValue(item) === over.id,
        );
        onItemMove?.(active.id, activeCol, overCol, newIndex === -1 ? overItems.length - 1 : newIndex);
      }
    },
    [value, onValueChange, getItemValue, columnKeys, onColumnMove, onItemMove],
  );

  const ctxValue = React.useMemo<KanbanContextValue<unknown>>(
    () => ({
      columns: value as Record<string, unknown[]>,
      activeId,
      activeType,
      getItemValue: getItemValue as (item: unknown) => UniqueIdentifier,
    }),
    [value, activeId, activeType, getItemValue],
  );

  return (
    <KanbanContext.Provider value={ctxValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        {children}
      </DndContext>
    </KanbanContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/*  KanbanBoard                                                                */
/* -------------------------------------------------------------------------- */

interface KanbanBoardProps extends React.ComponentProps<"div"> {
  children: React.ReactNode;
}

function KanbanBoard({ className, children, ...props }: KanbanBoardProps) {
  const ctx = useKanbanContext();
  const columnKeys = Object.keys(ctx.columns);

  return (
    <SortableContext items={columnKeys} strategy={verticalListSortingStrategy}>
      <div
        data-slot="kanban-board"
        className={cn("flex flex-col gap-4", className)}
        {...props}
      >
        {children}
      </div>
    </SortableContext>
  );
}

/* -------------------------------------------------------------------------- */
/*  KanbanColumn                                                               */
/* -------------------------------------------------------------------------- */

interface KanbanColumnProps extends React.ComponentProps<"div"> {
  value: string;
  children: React.ReactNode;
}

function KanbanColumn({
  value,
  className,
  children,
  ...props
}: KanbanColumnProps) {
  const ctx = useKanbanContext();
  const items = (ctx.columns[value] ?? []) as unknown[];
  const itemIds = items.map((item) => ctx.getItemValue(item));

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value,
    data: { type: "column" },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `${value}-droppable`,
    data: { type: "column", columnId: value },
  });

  const composedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      transform: CSS.Translate.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  const setRef = React.useCallback(
    (node: HTMLElement | null) => {
      setSortableRef(node);
      setDroppableRef(node);
    },
    [setSortableRef, setDroppableRef],
  );

  return (
    <KanbanColumnContext.Provider value={{ attributes, listeners }}>
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setRef}
          data-slot="kanban-column"
          data-column={value}
          style={composedStyle}
          className={cn(
            "rounded-lg border bg-muted/40 p-4",
            isDragging && "opacity-50",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </SortableContext>
    </KanbanColumnContext.Provider>
  );
}

interface KanbanColumnContextValue {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}

const KanbanColumnContext =
  React.createContext<KanbanColumnContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*  KanbanColumnHandle                                                         */
/* -------------------------------------------------------------------------- */

interface KanbanColumnHandleProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
}

function KanbanColumnHandle({
  asChild,
  className,
  ...props
}: KanbanColumnHandleProps) {
  const columnCtx = React.useContext(KanbanColumnContext);
  if (!columnCtx)
    throw new Error("`KanbanColumnHandle` must be used within `KanbanColumn`");

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      type="button"
      data-slot="kanban-column-handle"
      className={cn(
        "cursor-grab touch-none select-none active:cursor-grabbing",
        className,
      )}
      {...columnCtx.attributes}
      {...columnCtx.listeners}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  KanbanItem                                                                 */
/* -------------------------------------------------------------------------- */

interface KanbanItemProps extends React.ComponentProps<"div"> {
  value: UniqueIdentifier;
  asHandle?: boolean;
  asChild?: boolean;
}

function KanbanItem({
  value,
  asHandle,
  asChild,
  className,
  style,
  children,
  ...props
}: KanbanItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: value,
    data: { type: "item" },
  });

  const composedStyle = React.useMemo<React.CSSProperties>(
    () => ({
      transform: CSS.Translate.toString(transform),
      transition,
      ...style,
    }),
    [transform, transition, style],
  );

  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={(node: HTMLElement | null) => {
        setNodeRef(node);
        if (asHandle) setActivatorNodeRef(node);
      }}
      data-slot="kanban-item"
      data-dragging={isDragging ? "" : undefined}
      style={composedStyle}
      className={cn(
        isDragging && "opacity-50",
        asHandle && "cursor-grab touch-none select-none active:cursor-grabbing",
        className,
      )}
      {...(asHandle ? attributes : {})}
      {...(asHandle ? listeners : {})}
      {...props}
    >
      {children}
    </Comp>
  );
}

/* -------------------------------------------------------------------------- */
/*  KanbanOverlay                                                              */
/* -------------------------------------------------------------------------- */

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.4" } },
  }),
};

interface KanbanOverlayProps
  extends Omit<React.ComponentProps<typeof DragOverlay>, "children"> {
  children?: React.ReactNode;
}

function KanbanOverlay({ children, ...props }: KanbanOverlayProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useLayoutEffect(() => setMounted(true), []);

  const container = mounted ? globalThis.document?.body : null;
  if (!container) return null;

  return ReactDOM.createPortal(
    <DragOverlay dropAnimation={dropAnimation} {...props}>
      {children}
    </DragOverlay>,
    container,
  );
}

/* -------------------------------------------------------------------------- */
/*  Exports                                                                    */
/* -------------------------------------------------------------------------- */

export {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnHandle,
  KanbanItem,
  KanbanOverlay,
};
