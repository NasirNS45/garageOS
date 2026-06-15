import Logo from "../Logo";
import AuthPhoneMockup from "./AuthPhoneMockup";
import AuthLanguageToggle from "../AuthLanguageToggle";
import { useT } from "../../i18n/useT";

const GRID_PATTERN =
  "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')";

interface AuthHeroPanelProps {
  headlineKey:
    | "auth.heroLoginHeadline"
    | "auth.heroSignupHeadline"
    | "auth.heroForgotHeadline"
    | "auth.heroResetHeadline";
  subtextKey:
    | "auth.heroLoginSubtext"
    | "auth.heroSignupSubtext"
    | "auth.heroForgotSubtext"
    | "auth.heroResetSubtext";
}

/** Desktop auth hero — copy column left, phone column right. */
export default function AuthHeroPanel({
  headlineKey,
  subtextKey,
}: AuthHeroPanelProps) {
  const t = useT();

  return (
    <div
      className="hidden lg:flex lg:w-[52%] xl:w-[55%] lg:h-full relative overflow-hidden shrink-0"
      style={{ background: "var(--brand-panel)", colorScheme: "dark" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--brand) 30%, transparent) 0%, transparent 50%, color-mix(in srgb, var(--brand-panel) 80%, #000) 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: GRID_PATTERN }}
      />

      <div className="relative z-10 grid h-full w-full min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-x-6 xl:gap-x-10 px-8 xl:px-12 py-10">
        <div className="relative z-20 flex flex-col justify-between min-w-0 min-h-0 text-start">
          <div className="space-y-7">
            <div className="flex items-start justify-between gap-4">
              <Logo variant="full" size="lg" light to="/" />
              <AuthLanguageToggle variant="hero" />
            </div>
            <div>
              <h1 className="urdu-display text-white text-2xl xl:text-[1.65rem] font-bold leading-snug text-start">
                {t(headlineKey)}
              </h1>
              <p className="text-sm leading-relaxed mt-3" style={{ color: "color-mix(in srgb, white 85%, transparent)" }}>
                {t(subtextKey)}
              </p>
            </div>
          </div>
          <p className="text-xs tracking-wide pt-6 shrink-0" style={{ color: "color-mix(in srgb, white 55%, transparent)" }}>
            {t("auth.heroFooter")}
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-center self-center shrink-0 w-[270px] xl:w-[290px]" data-keep-ltr>
          <AuthPhoneMockup variant="compact" />
        </div>
      </div>
    </div>
  );
}
