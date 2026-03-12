import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from "@tanstack/react-table";
import { useState } from "react";
import Link from "next/link";
import { Contract } from "@/types/contract";
import { useDashboardStore } from "@/store/use-dashboard-store";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface ContractsTableProps {
  contracts: Contract[];
}

function RiskPill({ riskLevel }: { riskLevel: Contract["riskLevel"] }) {
  const label =
    riskLevel === "low" ? "Low" : riskLevel === "medium" ? "Medium" : "High";
  const color =
    riskLevel === "low"
      ? "text-success"
      : riskLevel === "medium"
      ? "text-warning"
      : "text-danger";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-medium",
        color
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label} risk
    </span>
  );
}

export function ContractsTable({ contracts }: ContractsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "nextDeadline", desc: false }
  ]);
  const { selectedContractId, setSelectedContract } = useDashboardStore();

  const columns: ColumnDef<Contract>[] = [
    {
      id: "name",
      header: "Contract",
      accessorFn: (row) => row.name,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="truncate text-[13px] font-medium text-primary">
            {row.original.name}
          </span>
          <span className="text-[11px] text-muted">{row.original.vendor}</span>
        </div>
      )
    },
    {
      id: "renewalType",
      header: "Renewal type",
      accessorKey: "renewalType",
      cell: ({ row }) => (
        <span className="text-[11px] text-muted capitalize">
          {row.original.renewalType.replace("-", " ")}
        </span>
      )
    },
    {
      id: "nextDeadline",
      header: "Next deadline",
      accessorKey: "nextDeadline",
      cell: ({ row }) => {
        const d = new Date(row.original.nextDeadline);
        return (
          <span className="text-[11px] text-secondary">
            {format(d, "MMM d")}
          </span>
        );
      }
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <span className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] capitalize text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          {row.original.status}
        </span>
      )
    },
    {
      id: "risk",
      header: "Risk",
      accessorKey: "riskLevel",
      cell: ({ row }) => <RiskPill riskLevel={row.original.riskLevel} />
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 rounded-full px-2 text-[11px]"
            asChild
          >
            <Link href={`/contracts/${row.original.id}`}>
              <ExternalLink className="mr-1 h-3 w-3" />
              View
            </Link>
          </Button>
        </div>
      )
    }
  ];

  const table = useReactTable({
    data: contracts,
    columns,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <table className="min-w-full border-separate border-spacing-0 text-xs">
        <thead className="bg-muted">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    "border-b border-border px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground",
                    header.column.id === "name" ? "pl-4" : "",
                    header.column.id === "value" ? "pr-4 text-right" : "",
                    header.column.id === "actions" ? "pr-4 w-0" : ""
                  )}
                >
                  {header.isPlaceholder ? null : header.column.id === "actions" ? (
                    <span className="sr-only">Actions</span>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em]"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.original.id === selectedContractId;
            return (
              <tr
                key={row.id}
                className={cn(
                  "group cursor-pointer border-t border-border/60 transition-colors transition-transform hover:bg-muted",
                  isSelected && "bg-muted translate-x-[2px] border-l-2 border-l-primary"
                )}
                onClick={() => setSelectedContract(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={cn(
                      "px-3 py-2.5 align-middle text-xs text-foreground",
                      cell.column.id === "name" ? "pl-4" : "",
                      cell.column.id === "value" ? "pr-4 text-right" : "",
                      cell.column.id === "actions" ? "pr-4" : ""
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

