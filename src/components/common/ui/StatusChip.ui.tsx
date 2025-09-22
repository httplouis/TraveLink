export default function StatusChip({ status }: { status: string }) {
  const color =
    status === "Available"
      ? "bg-[var(--color-accent)] text-white"
      : status === "Maintenance"
      ? "bg-[var(--color-warning)] text-white"
      : status === "On Trip"
      ? "bg-blue-600 text-white"
      : "bg-neutral-400 text-white";

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  );
}
