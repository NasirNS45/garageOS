import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui";
import { useT } from "../../i18n/useT";

const SHOW_AFTER_PX = 400;

/** Mobile-only sticky signup bar after scrolling past the hero. */
export default function LandingStickyCta() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-[var(--page-pad-x)] py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)]">
        <Button size="lg" fullWidth asChild>
          <Link to="/signup">{t("landing.stickyCta.label")}</Link>
        </Button>
      </div>
    </div>
  );
}
