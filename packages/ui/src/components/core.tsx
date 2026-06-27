import { X } from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

const cx = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  full?: boolean;
  icon?: boolean;
  breathe?: boolean;
}
export function Button({ variant = "primary", full, icon, breathe, className, ...props }: ButtonProps) {
  return <button className={cx("ff-button", `ff-button--${variant}`, full && "ff-button--full", icon && "ff-button--icon", breathe && "ff-breathe", className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ff-panel", className)} {...props} />;
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cx("ff-badge", className)} {...props} />;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> { label: string; code?: boolean; }
export function Input({ label, code, className, id, ...props }: InputProps) {
  const inputId = id ?? `field-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return <label className="ff-field" htmlFor={inputId}><span className="ff-label">{label}</span><input id={inputId} className={cx("ff-input", code && "ff-input--code", className)} {...props} /></label>;
}

export function Stack({ gap = 16, style, ...props }: HTMLAttributes<HTMLDivElement> & { gap?: number }) {
  return <div className="ff-stack" style={{ ...style, "--stack-gap": `${gap}px` } as CSSProperties} {...props} />;
}
export function Cluster({ gap = 12, style, ...props }: HTMLAttributes<HTMLDivElement> & { gap?: number }) {
  return <div className="ff-cluster" style={{ ...style, "--cluster-gap": `${gap}px` } as CSSProperties} {...props} />;
}
export function Container({ width = 1200, style, ...props }: HTMLAttributes<HTMLDivElement> & { width?: number }) {
  return <div className="ff-container" style={{ ...style, "--container-width": `${width}px` } as CSSProperties} {...props} />;
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="ff-dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="ff-dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><Cluster style={{ justifyContent: "space-between" }}><h2 style={{ margin: 0 }}>{title}</h2><Button variant="ghost" icon aria-label="Close" onClick={onClose}><X size={18} /></Button></Cluster><div style={{ marginTop: 16 }}>{children}</div></section></div>;
}

export function ToastRegion({ messages }: { messages: string[] }) {
  return <div className="ff-toast-region" aria-live="polite">{messages.map((message, index) => <div className="ff-toast" key={`${message}-${index}`}>{message}</div>)}</div>;
}

export { cx };
