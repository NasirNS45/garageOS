import { Link } from "react-router-dom";

interface LogoProps {
  /** "full" = icon + wordmark; "icon" = icon only; "wordmark" = text only */
  variant?: "full" | "icon" | "wordmark";
  size?: "sm" | "md" | "lg";
  /** Force white text (for dark backgrounds) */
  light?: boolean;
  /** If provided, wraps the logo in a React Router link */
  to?: string;
}

const ICON_SIZE = { sm: 28, md: 36, lg: 48 };
const TEXT_CLASS = { sm: "text-lg", md: "text-xl", lg: "text-3xl" };

export default function Logo({ variant = "full", size = "md", light = false, to }: LogoProps) {
  const px = ICON_SIZE[size];

  const icon = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="11" style={{ fill: "var(--brand)" }} />
      {/* Wrench silhouette */}
      <path
        d="M30.5 10a7 7 0 0 0-6.9 8.2L14 27.8A3 3 0 1 0 18.2 32l9.6-9.6A7 7 0 1 0 30.5 10Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
        fill="#F59E0B"
      />
      <circle cx="16.1" cy="30" r="1.5" style={{ fill: "var(--brand)" }} />
    </svg>
  );

  const wordmark = (
    <span className={`font-extrabold tracking-tight ${TEXT_CLASS[size]} ${light ? "text-white" : "text-slate-900"}`}>
      Garage<span className="text-[var(--brand)]">OS</span>
    </span>
  );

  const content =
    variant === "icon" ? icon :
    variant === "wordmark" ? wordmark : (
      <div className="flex items-center gap-2.5">
        {icon}
        {wordmark}
      </div>
    );

  if (to) {
    return (
      <Link to={to} className="inline-flex items-center shrink-0">
        {content}
      </Link>
    );
  }

  return <>{content}</>;
}
