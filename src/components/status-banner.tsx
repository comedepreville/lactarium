import { cn } from "@/lib/utils";

const statusStyles = {
  ok: "bg-[var(--blush)] text-[var(--rose-deep)]",
  behind: "bg-[#f7ebe0] text-[#8a5a3c]",
  ahead: "bg-[#f6e4e8] text-[var(--rose-deep)]",
  overdue: "bg-[#f3ddd8] text-[#7a3f3d]",
};

export function StatusBanner({
  status,
  message,
  className,
}: {
  status: keyof typeof statusStyles;
  message: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-2xl px-5 py-3.5 text-center text-sm leading-relaxed text-balance",
        statusStyles[status],
        className,
      )}
    >
      {message}
    </div>
  );
}
