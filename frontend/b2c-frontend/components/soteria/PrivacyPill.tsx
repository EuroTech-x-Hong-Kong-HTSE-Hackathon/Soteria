type Props = { label?: string; className?: string };

export function PrivacyPill({
  label = "Privacy Active",
  className = "",
}: Props) {
  return (
    <div
      className={
        "inline-flex items-center gap-xs rounded-full px-sm py-xs border border-[#009049]/30 " +
        className
      }
      style={{ backgroundColor: "#16321F", color: "#4ADE80" }}
    >
      <span className="material-symbols-outlined icon-fill" style={{ fontSize: 14 }}>
        lock
      </span>
      <span className="text-privacy-pill uppercase tracking-wider">{label}</span>
    </div>
  );
}