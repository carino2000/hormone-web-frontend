export default function PCFrame({ children }) {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-neutral-50 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
