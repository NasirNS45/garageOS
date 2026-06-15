import type { TKey } from "../i18n/translations";
import { useT } from "../i18n/useT";
import { cn } from "./ui";

interface NavItem {
  tab: string;
  labelKey: TKey;
  Icon: React.ElementType;
}

interface Props {
  items: NavItem[];
  activeTab: string;
  onSelect: (tab: string) => void;
}

/** Bottom tab bar with icon + label — mobile only (hidden on lg+). */
export default function MobileNav({ items, activeTab, onSelect }: Props) {
  const t = useT();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[var(--surface)] border-t border-[var(--border)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={t("nav.menu")}
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {items.map(({ tab, labelKey, Icon }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onSelect(tab)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-w-0 transition",
                active ? "text-[var(--brand)]" : "text-[var(--text-faint)]"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 2} aria-hidden />
              <span className={cn("text-[10px] font-semibold truncate max-w-full", active && "font-bold")}>
                {t(labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
