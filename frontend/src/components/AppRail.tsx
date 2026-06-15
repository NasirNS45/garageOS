import { Globe, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Logo from "./Logo";
import { useT } from "../i18n/useT";
import type { TKey } from "../i18n/translations";
import { useLanguageStore } from "../stores/languageStore";
import { useSidebarStore } from "../stores/sidebarStore";
import { layoutTransitionClass } from "../lib/pageMotion";
import { cn, Badge, Tooltip, TooltipContent, TooltipTrigger } from "./ui";

interface NavItem {
  tab: string;
  labelKey: TKey;
  Icon: React.ElementType;
}

interface Props {
  items: NavItem[];
  activeTab: string;
  onSelect: (tab: string) => void;
  onLogout: () => void;
  workshopName: string;
  role: string | null;
}

function SidebarTooltip({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  if (!collapsed) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

/** Collapsible labeled desktop sidebar. */
export default function AppRail({
  items,
  activeTab,
  onSelect,
  onLogout,
  workshopName,
  role,
}: Props) {
  const t = useT();
  const { language, toggleLanguage } = useLanguageStore();
  const { collapsed, toggle } = useSidebarStore();

  const roleLabel =
    role === "owner" ? t("role.owner") : role === "mechanic" ? t("role.mechanic") : null;

  const langLabel = language === "ur" ? "English" : "اردو";

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col fixed inset-y-0 start-0 z-30 w-[var(--sidebar-width)] overflow-hidden",
        layoutTransitionClass
      )}
      style={{
        background: "var(--rail-bg)",
        borderInlineEnd: "1px solid var(--rail-border)",
        colorScheme: "dark",
      }}
    >
      {/* Brand + workshop context */}
      <div
        className={cn("shrink-0", collapsed ? "px-2 py-3" : "px-4 py-4")}
        style={{ borderBottom: "1px solid var(--rail-border)" }}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "flex-col gap-2" : "justify-between gap-2"
          )}
        >
          {collapsed ? (
            <Logo variant="icon" size="sm" light to="/jobs" />
          ) : (
            <Logo variant="full" size="sm" light to="/jobs" />
          )}
          <SidebarTooltip
            label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
            collapsed={collapsed}
          >
            <button
              type="button"
              onClick={toggle}
              aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
              className={cn(
                "shrink-0 p-1.5 rounded-[var(--r-rail)] text-[var(--rail-text)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-text-active)] transition",
                collapsed && "w-full flex items-center justify-center"
              )}
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </SidebarTooltip>
        </div>

        {!collapsed && (
          <div className="mt-3 min-w-0">
            <p className="text-sm font-semibold text-[var(--rail-text-active)] truncate leading-snug">
              {workshopName}
            </p>
            {roleLabel && (
              <Badge
                tone="neutral"
                size="sm"
                className="mt-1.5 !bg-white/10 !text-white/70 !ring-white/15"
              >
                {roleLabel}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Primary navigation */}
      <nav
        className={cn("flex-1 overflow-y-auto", collapsed ? "px-2 py-3" : "px-3 py-4")}
        aria-label={t("nav.menu")}
      >
        {!collapsed && (
          <p
            className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            {t("nav.menu")}
          </p>
        )}
        <ul className="space-y-0.5">
          {items.map(({ tab, labelKey, Icon }) => {
            const active = activeTab === tab;
            const label = t(labelKey);
            return (
              <li key={tab}>
                <SidebarTooltip label={label} collapsed={collapsed}>
                  <button
                    type="button"
                    onClick={() => onSelect(tab)}
                    aria-current={active ? "page" : undefined}
                    aria-label={collapsed ? label : undefined}
                    title={collapsed ? undefined : label}
                    className={cn(
                      "w-full flex items-center rounded-[var(--r-rail)] text-sm font-medium transition-all duration-200 text-start",
                      collapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3 py-2.5",
                      active
                        ? "text-[var(--rail-text-active)]"
                        : "text-[var(--rail-text)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-text-active)]"
                    )}
                    style={
                      active
                        ? {
                            background: "color-mix(in srgb, var(--brand) 22%, transparent)",
                            boxShadow: "inset 3px 0 0 var(--brand)",
                          }
                        : undefined
                    }
                  >
                    <Icon size={18} className="shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </button>
                </SidebarTooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer utilities */}
      <div
        className={cn("shrink-0 space-y-0.5", collapsed ? "px-2 py-3" : "px-3 py-3")}
        style={{ borderTop: "1px solid var(--rail-border)" }}
      >
        <SidebarTooltip label={langLabel} collapsed={collapsed}>
          <button
            type="button"
            onClick={toggleLanguage}
            className={cn(
              "w-full flex items-center rounded-[var(--r-rail)] text-sm text-[var(--rail-text)] hover:bg-[var(--rail-hover)] hover:text-[var(--rail-text-active)] transition text-start",
              collapsed ? "justify-center py-2" : "gap-3 px-3 py-2"
            )}
          >
            <Globe size={17} className="shrink-0" aria-hidden />
            {!collapsed && <span data-keep-ltr>{langLabel}</span>}
          </button>
        </SidebarTooltip>

        <SidebarTooltip label={t("header.signOut")} collapsed={collapsed}>
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "w-full flex items-center rounded-[var(--r-rail)] text-sm text-[var(--rail-text)] hover:bg-[var(--danger-bg)] hover:text-[var(--danger-fg)] transition text-start",
              collapsed ? "justify-center py-2" : "gap-3 px-3 py-2"
            )}
          >
            <LogOut size={17} className="shrink-0" aria-hidden />
            {!collapsed && <span>{t("header.signOut")}</span>}
          </button>
        </SidebarTooltip>
      </div>
    </aside>
  );
}
