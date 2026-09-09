"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "./nav-items";

const STORAGE_KEY = "jhw-sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Reads localStorage (an external system unavailable during SSR) once on
    // mount to sync the persisted collapsed state, then marks the component
    // as client-mounted so the CSS transition doesn't animate on first paint.
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable; keep default
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from localStorage, unavailable during SSR
    setMounted(true);
    if (stored) setCollapsed(stored === "true");
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        "hidden md:flex h-screen sticky top-0 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
        !mounted && "duration-0"
      )}
    >
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Briefcase className="h-3.5 w-3.5" strokeWidth={2.25} />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold tracking-tight">
            Job Hunt Workspace
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pt-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-[15px] w-[15px] shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2.5">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-sm text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <ChevronsRight className="h-[15px] w-[15px]" strokeWidth={2} />
          ) : (
            <>
              <ChevronsLeft className="h-[15px] w-[15px]" strokeWidth={2} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
