import { type ReactNode, useEffect } from "react";
import { X, Check } from "lucide-react";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-muted-foreground/30"
      }`}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function Btn({
  variant = "primary", size = "md", children, className = "", ...rest
}: { variant?: "primary" | "outline" | "ghost" | "danger"; size?: "sm" | "md" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sz = size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-4 text-sm";
  const v = variant === "primary"
    ? "bg-primary text-primary-foreground hover:bg-primary-hover"
    : variant === "outline"
    ? "border border-primary text-primary bg-card hover:bg-accent"
    : variant === "danger"
    ? "bg-destructive text-destructive-foreground hover:opacity-90"
    : "text-foreground hover:bg-muted";
  return (
    <button {...rest} className={`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors disabled:opacity-50 ${sz} ${v} ${className}`}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = "neutral", className = "" }: { children: ReactNode; tone?: "neutral" | "primary" | "warning" | "info" | "destructive" | "outline"; className?: string }) {
  const map: Record<string, string> = {
    neutral: "bg-muted text-foreground",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning text-warning-foreground",
    info: "bg-info text-info-foreground",
    destructive: "bg-destructive/10 text-destructive",
    outline: "border border-border text-muted-foreground",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]} ${className}`}>{children}</span>;
}

export function Modal({ open, onClose, title, children, footer, size = "md" }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; size?: "sm" | "md" | "lg" }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  const w = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-2xl" : "max-w-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <div className={`w-full ${w} rounded-xl bg-card shadow-xl`} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="text-base font-semibold text-foreground">{title}</div>
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-5 pb-2 text-sm text-foreground">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3 mt-3">{footer}</div>}
      </div>
    </div>
  );
}

export function SlideOver({ open, onClose, title, children, footer, width = 360 }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full flex-col bg-card shadow-2xl" style={{ width }}>
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="text-base font-semibold">{title}</div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-border px-5 py-3">{footer}</div>}
      </aside>
    </div>
  );
}

export function Toast({ open, onClose, message }: { open: boolean; onClose: () => void; message: string }) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed left-1/2 top-20 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-xl bg-foreground px-6 py-4 text-background shadow-2xl">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function DragHandle({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-grid cursor-grab grid-cols-2 gap-[2px] text-muted-foreground/60 active:cursor-grabbing ${className}`} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="h-[3px] w-[3px] rounded-full bg-current" />
      ))}
    </span>
  );
}
