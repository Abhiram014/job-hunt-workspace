"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import type { ApplicationListItem } from "@/types/application";

const columns: ColumnDef<ApplicationListItem>[] = [
  {
    accessorKey: "company",
    header: ({ column }) => (
      <SortButton column={column}>Company</SortButton>
    ),
    cell: ({ row }) => (
      <Link href={`/applications/${row.original.id}`} className="font-medium hover:underline">
        {row.original.company}
      </Link>
    ),
  },
  {
    accessorKey: "jobTitle",
    header: ({ column }) => <SortButton column={column}>Role</SortButton>,
  },
  {
    accessorKey: "location",
    header: ({ column }) => <SortButton column={column}>Location</SortButton>,
    cell: ({ row }) => row.original.location || <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "applicationStatus",
    header: ({ column }) => <SortButton column={column}>Status</SortButton>,
    cell: ({ row }) => <StatusBadge status={row.original.applicationStatus} />,
  },
  {
    id: "resume",
    header: "Resume",
    cell: ({ row }) => {
      const r = row.original.applicationResumes[0]?.resume;
      return r ? (
        <span className="text-sm">{r.name} <span className="text-muted-foreground">v{r.version}</span></span>
      ) : (
        <span className="text-sm text-muted-foreground">Not attached</span>
      );
    },
  },
  {
    accessorKey: "dateApplied",
    header: ({ column }) => <SortButton column={column}>Applied</SortButton>,
    cell: ({ row }) =>
      row.original.dateApplied ? (
        new Date(row.original.dateApplied).toLocaleDateString()
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <SortButton column={column}>Updated</SortButton>,
    cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString(),
  },
];

function SortButton({ column, children }: { column: { toggleSorting: (desc?: boolean) => void; getIsSorted: () => false | "asc" | "desc" }; children: React.ReactNode }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-3 h-7 px-2"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {children}
      <ArrowUpDown className="ml-1.5 h-3 w-3" />
    </Button>
  );
}

export function ApplicationsTable({ applications }: { applications: ApplicationListItem[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "updatedAt", desc: true }]);

  const table = useReactTable({
    data: applications,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
