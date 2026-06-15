import type { ReactNode } from "react";
import AuthHeroPanel from "./AuthHeroPanel";
import AuthLanguageToggle from "../AuthLanguageToggle";
import Logo from "../Logo";
import { Card } from "../ui";

interface AuthLayoutProps {
  heroHeadlineKey:
    | "auth.heroLoginHeadline"
    | "auth.heroSignupHeadline"
    | "auth.heroForgotHeadline"
    | "auth.heroResetHeadline";
  heroSubtextKey:
    | "auth.heroLoginSubtext"
    | "auth.heroSignupSubtext"
    | "auth.heroForgotSubtext"
    | "auth.heroResetSubtext";
  title: string;
  subtitle: string;
  footer?: ReactNode;
  children: ReactNode;
}

/** Split hero (desktop) + centered form card layout for auth pages. */
export default function AuthLayout({
  heroHeadlineKey,
  heroSubtextKey,
  title,
  subtitle,
  footer,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col lg:flex-row bg-[var(--page)]">
      <AuthHeroPanel headlineKey={heroHeadlineKey} subtextKey={heroSubtextKey} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 lg:py-6 lg:px-10 xl:px-16 lg:min-h-0 lg:overflow-y-auto">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <Logo variant="full" size="md" to="/" />
        </div>

        <div className="w-full max-w-[400px]">
          <Card variant="elevated" padding="lg" className="rounded-[var(--r-card)]">
            <h1 className="text-xl font-bold text-[var(--text-strong)] mb-1">{title}</h1>
            <p className="text-sm text-[var(--text-muted)] mb-5">{subtitle}</p>
            {children}
            {footer && (
              <div className="border-t border-[var(--border)] mt-6 pt-5 text-center">
                {footer}
              </div>
            )}
          </Card>

          <div className="mt-6 flex justify-center lg:hidden">
            <AuthLanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
}
