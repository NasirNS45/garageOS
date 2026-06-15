import {
  CircleCheck,
  Info,
  LoaderCircle,
  OctagonX,
  TriangleAlert,
} from "lucide-react";
import { Toaster as Sonner } from "sonner";
import { useThemeStore } from "@/stores/themeStore";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const mode = useThemeStore((s) => s.mode);

  return (
    <Sonner
      theme={mode as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info:    <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error:   <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[var(--surface)] group-[.toaster]:text-[var(--text-strong)] group-[.toaster]:border-[var(--border)] group-[.toaster]:shadow-[var(--shadow-md)]",
          description: "group-[.toast]:text-[var(--text-muted)]",
          actionButton:
            "group-[.toast]:bg-[var(--brand)] group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:bg-[var(--surface-2)] group-[.toast]:text-[var(--text-muted)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
