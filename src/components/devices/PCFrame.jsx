export default function PCFrame({ children }) {
  return (
    <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl dark:border-white/10 dark:bg-slate-900 dark:shadow-black/40">
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-neutral-50 px-4 py-2.5 dark:border-white/5 dark:bg-slate-950/60">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </div>
      {/* 페이지마다 콘텐츠 길이가 달라도(홈/예측상세/달력) 창 크기가 늘었다 줄었다 하지
          않도록 고정 높이 + 내부 스크롤로 처리한다. 기준은 세 화면 중 가장 긴 달력
          탭(약 568px)보다 여유 있게 큰 값. */}
      <div className="h-[600px] overflow-y-auto p-6">{children}</div>
    </div>
  );
}
