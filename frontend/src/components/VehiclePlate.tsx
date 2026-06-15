interface VehiclePlateProps {
  number: string;
  size?: "sm" | "md";
  variant?: "default" | "subtle";
}

const SIZE = {
  sm: "px-2 py-0.5 text-[11px] tracking-[0.12em]",
  md: "px-3 py-1 text-sm tracking-[0.15em]",
};

export default function VehiclePlate({
  number,
  size = "md",
  variant = "default",
}: VehiclePlateProps) {
  const isSubtle = variant === "subtle";

  return (
    <span
      aria-label={`Plate: ${number}`}
      data-keep-ltr
      className={`inline-flex items-center font-mono font-black uppercase rounded-md ${SIZE[size]} ${
        isSubtle ? "shadow-sm" : "shadow-md"
      }`}
      style={{
        background: isSubtle
          ? "linear-gradient(135deg, #FEF9C3 0%, #FDE68A 60%, #FCD34D 100%)"
          : "linear-gradient(135deg, #FEF08A 0%, #FDE047 60%, #FACC15 100%)",
        border: isSubtle ? "1.5px solid #334155" : "2px solid #1e293b",
        color: "#0f172a",
        letterSpacing: size === "sm" ? "0.12em" : "0.15em",
        textShadow: "0 1px 0 rgba(255,255,255,0.35)",
      }}
    >
      {number}
    </span>
  );
}
