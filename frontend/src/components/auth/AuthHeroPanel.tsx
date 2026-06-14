import Logo from "../Logo";
import AuthPhoneMockup from "./AuthPhoneMockup";
import AuthLanguageToggle from "../AuthLanguageToggle";
import { useT } from "../../i18n/useT";

const GRID_PATTERN =
  "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNiI+PHBhdGggZD0ibTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NGgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NGgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')";

interface AuthHeroPanelProps {
  headlineKey: "auth.heroLoginHeadline" | "auth.heroSignupHeadline";
  subtextKey: "auth.heroLoginSubtext" | "auth.heroSignupSubtext";
}

/** Desktop auth hero — copy column left, phone column right. */
export default function AuthHeroPanel({
  headlineKey,
  subtextKey,
}: AuthHeroPanelProps) {
  const t = useT();

  return (
    <div className="hidden lg:flex lg:w-1/2 lg:h-screen lg:sticky lg:top-0 bg-[var(--brand-panel)] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/25 via-transparent to-blue-950/50 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: GRID_PATTERN }}
      />

      <div className="relative z-10 grid h-full w-full min-h-0 grid-cols-[minmax(0,1fr)_auto] gap-x-6 xl:gap-x-10 px-8 xl:px-12 py-10">
        <div className="relative z-20 flex flex-col justify-between min-w-0 min-h-0">
          <div className="space-y-7">
            <div className="flex items-start justify-between gap-4">
              <Logo variant="full" size="lg" light to="/" />
              <AuthLanguageToggle variant="hero" />
            </div>
            <div>
              <h1 className="urdu-display text-white text-2xl xl:text-[1.65rem] font-bold leading-snug">
                {t(headlineKey)}
              </h1>
              <p className="text-blue-100/90 text-sm leading-relaxed mt-3">{t(subtextKey)}</p>
            </div>
          </div>
          <p className="text-blue-300/75 text-xs tracking-wide pt-6 shrink-0">
            {t("auth.heroFooter")}
          </p>
        </div>

        <div className="relative z-10 flex items-center justify-center self-center shrink-0 w-[270px] xl:w-[290px]">
          <AuthPhoneMockup variant="compact" />
        </div>
      </div>
    </div>
  );
}
