export default function MobileFrame({ children }) {
  return (
    <div className="mx-auto w-[380px] max-w-full overflow-hidden rounded-[2.5rem] border-8 border-neutral-900 bg-white shadow-xl">
      <div className="mx-auto mt-2 h-5 w-28 rounded-full bg-neutral-900" />
      <div className="max-h-[720px] overflow-y-auto p-4">{children}</div>
    </div>
  );
}
