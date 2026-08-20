export default function WatchFrame({ children }) {
  return (
    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-[2.5rem] border-8 border-neutral-900 bg-black p-3 shadow-xl">
      <div className="flex h-full w-full items-center justify-center rounded-[2rem] bg-neutral-950 p-3 text-white">
        {children}
      </div>
    </div>
  );
}
