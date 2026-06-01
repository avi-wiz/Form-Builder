import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  LayoutDashboard, ClipboardList, Receipt, Users, FileText, SlidersHorizontal,
  FolderOpen, Boxes, Headset, Store, Settings as SettingsIcon, LogOut, Bell, ChevronDown,
} from "lucide-react";

interface NavItem { icon: typeof FileText; label: string; to: string }

const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" },
  { icon: ClipboardList, label: "Orders", to: "/orders" },
  { icon: Receipt, label: "Sales", to: "/sales" },
  { icon: Users, label: "Customers", to: "/customers/C_01396" },
  { icon: FileText, label: "Forms", to: "/forms" },
  { icon: SlidersHorizontal, label: "Manage", to: "/manage" },
  { icon: FolderOpen, label: "Files", to: "/files" },
  { icon: Boxes, label: "Products", to: "/products" },
  { icon: Headset, label: "Leads", to: "/leads" },
  { icon: Store, label: "Store", to: "/store" },
  { icon: SettingsIcon, label: "Settings", to: "/settings/workflow-manager/w_1" },
  { icon: LogOut, label: "Logout", to: "/logout" },
];

function pathStartsWith(pathname: string, to: string) {
  if (to === "/forms") return pathname === "/forms" || pathname.startsWith("/forms/");
  if (to.startsWith("/customers")) return pathname.startsWith("/customers");
  if (to.startsWith("/settings")) return pathname.startsWith("/settings");
  return pathname === to;
}

export function AppShell({ breadcrumb, children }: { breadcrumb: { label: string; to?: string }[]; children: ReactNode }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-1 bg-sidebar py-3 text-sidebar-foreground">
        {NAV.map((it) => {
          const active = pathStartsWith(pathname, it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              to={it.to}
              title={it.label}
              className={`group relative flex h-9 w-9 items-center justify-center rounded-md transition-colors ${
                active ? "bg-primary text-primary-foreground" : "hover:bg-sidebar-accent"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="pointer-events-none absolute left-12 top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded bg-sidebar-accent px-2 py-1 text-xs group-hover:block">
                {it.label}
              </span>
            </Link>
          );
        })}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                {b.to ? (
                  <Link to={b.to} className="hover:text-foreground">{b.label}</Link>
                ) : (
                  <span className="font-medium text-foreground">{b.label}</span>
                )}
              </span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="rounded-full p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </button>
            <button className="flex items-center gap-1 rounded-md hover:bg-muted">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-info text-info-foreground font-semibold">I</div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
