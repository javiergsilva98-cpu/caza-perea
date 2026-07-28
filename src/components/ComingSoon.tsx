export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <p className="max-w-xs text-sm text-foreground/60">{description}</p>
      <span className="mt-2 rounded-full bg-emerald-800/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-400">
        Próximamente
      </span>
    </div>
  );
}
