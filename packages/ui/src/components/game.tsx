import { Check } from "lucide-react";
import type { Card as GameCardData, FeedEntry } from "@snap-swap/shared";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import { cx } from "./core";

const paths: Record<string, ReactNode> = {
  dress: <path d="M18.5 8 24 12l5.5-4 3.5 6.5-2.5 4.3C36 24 37 33 37 40H11c0-7 1-16 6.5-21.2L15 14.5Z" />,
  jacket: <><path d="M17 9l7 4.5L31 9l5 3.5-3.5 6.5L34 40H14l1.5-21-3.5-6.5Z" /><path d="M24 13.5V40" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.6" /></>,
  pants: <path d="M15 9h18l.5 5-2.5 27h-5.5L24 22l-1.5 19H17l-2.5-27Z" />,
  shoes: <path d="M9 23c4-1 7.5-3.5 10.5-8.5L23 16l1 7 13 4c2 1 2.5 3 2 6l-2 2H11c-2.5 0-3-3-3-6 0-3-.5-5 1-6Z" />,
  hat: <><path d="M12 30c0-14 24-14 24 0Z" /><path d="M33 30h9c0 3.5-4 4-9 4Z" /></>,
  bag: <><path d="M18 17c0-7.5 12-7.5 12 0" fill="none" stroke="var(--card-color)" strokeWidth="2.6" /><path d="M14 17h20l2 21H12Z" /></>
};

const colorTokens: Record<string, { base: string; tint: string; ink: string }> = {
  sky: { base: "var(--sg-sky-base)", tint: "var(--sg-sky-tint)", ink: "var(--sg-sky-ink)" },
  coral: { base: "var(--sg-coral-base)", tint: "var(--sg-coral-tint)", ink: "var(--sg-coral-ink)" },
  mint: { base: "var(--sg-mint-base)", tint: "var(--sg-mint-tint)", ink: "var(--sg-mint-ink)" },
  lilac: { base: "var(--sg-lilac-base)", tint: "var(--sg-lilac-tint)", ink: "var(--sg-lilac-ink)" },
  peach: { base: "var(--sg-peach-base)", tint: "var(--sg-peach-tint)", ink: "var(--sg-peach-ink)" },
  honey: { base: "var(--sg-honey-base)", tint: "var(--sg-honey-tint)", ink: "var(--sg-honey-ink)" }
};

export interface GameCardProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> {
  card: Pick<GameCardData, "groupName" | "itemName" | "itemKey" | "color">;
  selected?: boolean;
  matched?: boolean;
  dimmed?: boolean;
  ghost?: boolean;
  mini?: boolean;
}
export function GameCard({ card, selected, matched, dimmed, ghost, mini, className, ...props }: GameCardProps) {
  const tone = colorTokens[card.groupName.toLowerCase()] ?? { base: card.color, tint: `color-mix(in srgb, ${card.color} 22%, white)`, ink: card.color };
  return <button className={cx("ff-game-card", selected && "ff-game-card--selected", matched && "ff-game-card--matched", dimmed && "ff-game-card--dimmed", ghost && "ff-game-card--ghost", mini && "ff-game-card--mini", className)} style={{ "--card-color": card.color, "--card-base": tone.base, "--card-tint": tone.tint, "--card-ink": tone.ink } as CSSProperties} {...props}>
    {matched && <span className="ff-game-card__check"><Check size={13} strokeWidth={3} /></span>}
    <span className="ff-game-card__art"><svg viewBox="0 0 48 48" fill={card.color} stroke="rgba(40,18,46,.3)" strokeWidth=".8" strokeLinejoin="round">{paths[card.itemKey] ?? paths.dress}</svg></span>
    <span className="ff-game-card__label">{card.groupName} {card.itemName}</span>
  </button>;
}

export function PlayerAvatar({ name, color, size = 44, float = false }: { name: string; color: string; size?: number; float?: boolean }) {
  return <div className="ff-avatar" style={{ background: color, "--avatar-size": `${size}px`, animation: float ? "ff-float 5s var(--ff-ease) infinite" : undefined } as CSSProperties}>{name.trim().charAt(0).toUpperCase()}</div>;
}

export function ProgressIndicator({ value, max = 4, color, height = 7 }: { value: number; max?: number; color: string; height?: number }) {
  const percentage = Math.max(0, Math.min(100, max === 0 ? 0 : value / max * 100));
  return <div className="ff-progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} style={{ "--progress-height": `${height}px` } as CSSProperties}><div className="ff-progress__fill" style={{ width: `${percentage}%`, background: color }} /></div>;
}

export function ActivityFeedItem({ entry }: { entry: FeedEntry }) {
  return <div className="ff-feed-item"><span className="ff-feed-item__dot" style={{ background: entry.color }} /><span><strong style={{ color: "var(--ff-ink)", fontWeight: 800 }}>{entry.who}</strong> {entry.text}</span></div>;
}
