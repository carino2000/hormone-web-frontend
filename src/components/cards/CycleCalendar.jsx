import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import MonthGrid from "../calendar/MonthGrid";
import PhaseLegend from "../calendar/PhaseLegend";
import DiaryPanel from "../calendar/DiaryPanel";
import { addMonths, dateKeyOf } from "../../lib/calendarGrid";
import { useCalendarNotes } from "../../lib/useCalendarNotes";

const SHEET_TRANSITION_MS = 300;

export default function CycleCalendar({ calendar, device = "pc", currentDay, currentDate, coldStartDays }) {
  const [initialYear, initialMonth] = (currentDate ?? calendar.days[0]?.date ?? "2026-01-01")
    .split("-")
    .map(Number);
  const [cursor, setCursor] = useState(new Date(initialYear, initialMonth - 1, 1));
  const [selectedKey, setSelectedKey] = useState(null);
  const { notes, saveNote, deleteNote } = useCalendarNotes();

  // 모바일 바텀시트를 실제 앱처럼 슬라이드 인/아웃 시키기 위한 상태.
  // sheetMounted: DOM에 존재하는지 (닫힘 애니메이션이 끝날 때까지는 남겨둠)
  // sheetOpen: translate-y 위치(열림/닫힘)를 트리거하는 값
  // displaySheetKey: 닫히는 동안에도 직전 날짜 메모 내용을 그대로 보여주기 위한 값
  //                  (selectedKey는 닫는 순간 바로 null이 되므로 따로 둔다)
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [displaySheetKey, setDisplaySheetKey] = useState(null);

  // selectedKey가 바뀐 "즉시" 반응해야 하는 부분(마운트 시작 / 닫힘 애니메이션 시작)은
  // 렌더링 중에 조정한다 — React 권장 패턴, effect보다 한 프레임 더 빠르게 반영된다.
  const [prevSelectedKeyForSheet, setPrevSelectedKeyForSheet] = useState(selectedKey);
  if (device === "mobile" && selectedKey !== prevSelectedKeyForSheet) {
    setPrevSelectedKeyForSheet(selectedKey);
    if (selectedKey) {
      setDisplaySheetKey(selectedKey);
      setSheetMounted(true);
    } else {
      setSheetOpen(false);
    }
  }

  // 반면 "마운트된 다음 한 프레임 뒤에 열기(트랜지션이 실제로 보이게)"와 "닫힘 애니메이션이
  // 끝난 뒤 마운트 해제"는 브라우저 타이밍(rAF/setTimeout)에 의존하는 진짜 side effect다.
  useEffect(() => {
    if (device !== "mobile") return undefined;

    if (selectedKey) {
      // rAF 한 번만 쓰면 "닫힌 상태"가 브라우저에 실제로 페인트되기 전에 바로 "열림"으로
      // 바뀌어서 트랜지션이 생략될 수 있다 — 두 번째 rAF로 한 프레임 더 넘겨서 보장한다.
      let raf2 = 0;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setSheetOpen(true));
      });
      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    if (sheetMounted) {
      const timeout = setTimeout(() => setSheetMounted(false), SHEET_TRANSITION_MS);
      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [selectedKey, device, sheetMounted]);

  // status: 'predicted'(phase 색으로 표시) | 'collecting'(콜드스타트 중, 아직 예측 없음)
  // | 'future'(시뮬레이터가 아직 넘기지 않은 날 — 스포일러 방지로 표시 안 함)
  const statusByDate = useMemo(
    () => Object.fromEntries(calendar.days.map((d) => [d.date, d])),
    [calendar.days],
  );
  const phaseByDate = useMemo(
    () => Object.fromEntries(calendar.days.filter((d) => d.status === "predicted").map((d) => [d.date, d.phase])),
    [calendar.days],
  );

  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
  const cursorMonthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const hasPredictionData = calendar.days.some(
    (d) => d.date.startsWith(cursorMonthKey) && d.status !== "future",
  );

  const goToday = () => {
    const today = new Date();
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(dateKeyOf(today));
  };

  const calendarCard = (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="이전 달"
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-400 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-amber-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="w-28 text-center text-sm font-semibold text-neutral-800 dark:text-slate-100">
            {monthLabel}
          </h3>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="다음 달"
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-400 dark:text-slate-500 dark:hover:bg-white/5 dark:hover:text-amber-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-50 dark:border-amber-400/30 dark:text-amber-400 dark:hover:bg-amber-400/10"
        >
          오늘
        </button>
      </div>

      <div className="mt-4">
        <MonthGrid
          key={cursorMonthKey}
          cursorDate={cursor}
          phaseByDate={phaseByDate}
          statusByDate={statusByDate}
          notesByDate={notes}
          selectedKey={selectedKey}
          onSelectDate={setSelectedKey}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-3 dark:border-white/5">
        <PhaseLegend />
        <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-slate-400">
          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-sky-300 dark:border-sky-400" />
          수집 중
        </div>
      </div>

      {!hasPredictionData && (
        <p className="mt-3 text-center text-[11px] text-neutral-300 dark:text-slate-600">
          이 달은 예측 데이터가 아직 없어요
        </p>
      )}

      {/* 예전엔 "다음 월경 예상" 이 여기 있었다. 모델이 오늘자 phase 만 준다고 해서
          그 기능을 합의 하에 뺐고, 같은 자리에 오늘 단계를 보여준다. */}
      {calendar.today_phase_label_ko ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-500 dark:bg-amber-400/10 dark:text-amber-400">
          <Sparkles className="h-4 w-4 shrink-0" />
          오늘은 <span className="font-semibold">{calendar.today_phase_label_ko}</span> 입니다
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-500 dark:bg-sky-400/10 dark:text-sky-300">
          <Sparkles className="h-4 w-4 shrink-0" />
          베이스라인 데이터 수집 중 · {currentDay}/{coldStartDays}일
        </div>
      )}
    </div>
  );

  const closeDiary = () => setSelectedKey(null);

  if (device === "mobile") {
    // 모바일에서는 메모를 하단 바텀시트로 띄운다 — 폰 프레임 높이가 내용에 따라
    // 늘어나지 않도록(고정 크기), 메모는 달력 흐름에 끼워 넣지 않고 오버레이로 처리.
    // 실제 앱처럼 아래에서 슬라이드 업/다운되도록 transform + opacity를 트랜지션한다.
    return (
      <>
        {calendarCard}
        {sheetMounted && (
          <>
            <div
              className={`absolute inset-0 z-10 bg-neutral-900/10 transition-opacity duration-300 dark:bg-black/40 ${
                sheetOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={closeDiary}
            />
            <div
              className={`absolute inset-x-0 bottom-0 z-20 rounded-t-3xl border border-b-0 border-rose-100 bg-white p-4 pt-3 shadow-[0_-16px_32px_-12px_rgba(244,63,94,0.35)] transition-transform duration-300 ease-out dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_-16px_32px_-12px_rgba(0,0,0,0.7)] ${
                sheetOpen ? "translate-y-0" : "translate-y-full"
              }`}
            >
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200 dark:bg-slate-700" />
              <DiaryPanel
                dateKey={displaySheetKey}
                phase={displaySheetKey ? phaseByDate[displaySheetKey] : null}
                note={displaySheetKey ? notes[displaySheetKey] || "" : ""}
                onSave={saveNote}
                onDelete={deleteNote}
                onClose={closeDiary}
                variant="sheet"
              />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-3 items-stretch gap-4">
      <div className="col-span-2">{calendarCard}</div>
      <div className="col-span-1">
        <DiaryPanel
          key={selectedKey ?? "empty"}
          dateKey={selectedKey}
          phase={selectedKey ? phaseByDate[selectedKey] : null}
          note={selectedKey ? notes[selectedKey] || "" : ""}
          onSave={saveNote}
          onDelete={deleteNote}
          onClose={selectedKey ? closeDiary : undefined}
        />
      </div>
    </div>
  );
}
