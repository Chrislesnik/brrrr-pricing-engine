import "@1771technologies/lytenyte-pro/grid.css";
import type {
  Grid as G,
  RowLayout,
  RowNormalRowLayout,
} from "@1771technologies/lytenyte-pro/types";
import { Grid } from "@1771technologies/lytenyte-pro";
import { memo, type ReactNode } from "react";

export function LyteNyte<T>({ grid }: { grid: G<T> }) {
  const view = grid.view.useValue();

  return (
    <div className="lng-grid lng1771-shadcn w-full h-full rounded-md border bg-background overflow-hidden">
      <Grid.Root grid={grid}>
        <Grid.Viewport className="text-sm">
          <Grid.Header className="border-b bg-muted/40">
            {view.header.layout.map((headerRow, i) => {
              return (
                <Grid.HeaderRow
                  headerRowIndex={i}
                  key={i}
                  className="min-h-[42px]"
                >
                  {headerRow.map((headerCell) => {
                    if (headerCell.kind === "group")
                      return (
                        <Grid.HeaderGroupCell
                          cell={headerCell}
                          key={headerCell.idOccurrence}
                        />
                      );

                    return (
                      <Grid.HeaderCell
                        className="flex items-center px-3 py-2 text-xs font-medium text-muted-foreground"
                        cell={headerCell}
                        key={headerCell.id}
                      />
                    );
                  })}
                </Grid.HeaderRow>
              );
            })}
          </Grid.Header>
          <Grid.RowsContainer className="divide-y divide-border gap-0 [&_.lng-row]:my-0 [&_.lng-row]:first:mt-0 [&_.lng-row]:last:mb-0">
            <Grid.RowsTop className="bg-background space-y-0">
              <RowHandler rows={view.rows.top} />
            </Grid.RowsTop>
            <Grid.RowsCenter className="bg-background space-y-0">
              <RowHandler rows={view.rows.center} />
            </Grid.RowsCenter>
            <Grid.RowsBottom className="bg-background space-y-0">
              <RowHandler rows={view.rows.bottom} />
            </Grid.RowsBottom>
          </Grid.RowsContainer>
        </Grid.Viewport>
      </Grid.Root>
    </div>
  );
}

const RowHandler = <T,>(props: { rows: RowLayout<T>[] }) => {
  return props.rows.map((row) => {
    if (row.kind === "full-width")
      return <Grid.RowFullWidth key={row.id} row={row} />;

    return <Row key={row.id} row={row} />;
  });
};
function RowImpl<T>({ row }: { row: RowNormalRowLayout<T> }) {
  return (
    <Grid.Row
      key={row.id}
      row={row}
      className="min-h-0 hover:bg-muted/50 data-[selected=true]:bg-muted transition-colors"
    >
      {row.cells.map((cell) => {
        const padding = cell.id === "actions" ? "px-px" : "px-3"
        const borderFix =
          cell.id === "actions"
            ? "border-l-0"
            : cell.id === "created_at"
              ? "border-r-0"
              : ""
        return (
          <Grid.Cell
            className={`flex items-center ${padding} py-1 text-sm ${borderFix}`}
            cell={cell}
            key={cell.id}
          />
        );
      })}
    </Grid.Row>
  );
}

const Row = memo(RowImpl) as <T>(props: {
  row: RowNormalRowLayout<T>;
}) => ReactNode;
