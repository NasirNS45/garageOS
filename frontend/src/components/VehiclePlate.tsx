interface VehiclePlateProps {
  number: string;
  size?: "sm" | "md";
}

const SIZE = {
  sm: "px-2.5 py-0.5 text-xs tracking-[0.15em]",
  md: "px-3.5 py-1 text-sm tracking-[0.18em]",
};

export default function VehiclePlate({ number, size = "md" }: VehiclePlateProps) {
  return (
    <span
      aria-label={`Plate: ${number}`}
      className={`inline-flex items-center font-mono font-black uppercase rounded-md shadow-md ${SIZE[size]}`}
      style={{
        background: "linear-gradient(135deg, #FEF08A 0%, #FDE047 60%, #FACC15 100%)",
        border: "2px solid #1e293b",
        color: "#0f172a",
        letterSpacing: "0.15em",
        textShadow: "0 1px 0 rgba(255,255,255,0.4)",
      }}
    >
      {number}
    </span>
  );
}
