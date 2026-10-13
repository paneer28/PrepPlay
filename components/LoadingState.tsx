export function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-20 text-center">
      <span aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-4 border-track border-t-brand motion-reduce:animate-none" />
      <span className="text-body font-bold text-fg">{label}</span>
    </div>
  );
}
