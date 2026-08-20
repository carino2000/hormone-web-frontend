import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import MonthGrid from "../calendar/MonthGrid";
import PhaseLegend from "../calendar/PhaseLegend";
import DiaryPanel from "../calendar/DiaryPanel";
import { addMonths, dateKeyOf } from "../../lib/calendarGrid";
import { useCalendarNotes } from "../../lib/useCalendarNotes";

export default function CycleCalendar({ calendar, device = "pc" }) {
  const [year, month] = calendar.month.split("-").map(Number);
  const [cursor, setCursor] = useState(new Date(year, month - 1, 1));
  const [selectedKey, setSelectedKey] = useState(null);
  const { notes, saveNote, deleteNote } = useCalendarNotes();

  const phaseByDate = useMemo(
    () => Object.fromEntries(calendar.days.map((d) => [d.date, d.phase])),
    [calendar.days],
  );

  const monthLabel = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;
  const cursorMonthKey = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
  const hasPredictionData = cursorMonthKey === calendar.month;

  const goToday = () => {
    const today = new Date();
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedKey(dateKeyOf(today));
  };

  const calendarCard = (
    <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="이전 달"
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-400"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="w-28 text-center text-sm font-semibold text-neutral-800">{monthLabel}</h3>
          <button
            type="button"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="다음 달"
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-400"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={goToday}
          className="rounded-full border border-rose-200 px-3 py-1 text-[11px] font-medium text-rose-400 transition hover:bg-rose-50"
        >
          오늘
        </button>
      </div>

      <div className="mt-4">
        <MonthGrid
          cursorDate={cursor}
          phaseByDate={phaseByDate}
          notesByDate={notes}
          selectedKey={selectedKey}
          onSelectDate={setSelectedKey}
        />
      </div>

      <div className="mt-3 border-t border-black/5 pt-3">
        <PhaseLegend />
      </div>

      {!hasPredictionData && (
        <p className="mt-3 text-center text-[11px] text-neutral-300">이 달은 예측 데이터가 아직 없어요</p>
      )}

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-500">
        <Sparkles className="h-4 w-4 shrink-0" />
        다음 월경 예상: <span className="font-semibold">{calendar.next_period_estimate}</span>
      </div>
    </div>
  );

  const closeDiary = () => setSelectedKey(null);

  if (device === "mobile") {
    // 모바일에서는 메모를 하단 바텀시트로 띄운다 — 폰 프레임 높이가 내용에 따라
    // 늘어나지 않도록(고정 크기), 메모는 달력 흐름에 끼워 넣지 않고 오버레이로 처리.
    return (
      <>
        {calendarCard}
        {selectedKey && (
          <>
            <div className="absolute inset-0 z-10 bg-neutral-900/10" onClick={closeDiary} />
            <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-3xl border border-b-0 border-rose-100 bg-white p-4 pt-3 shadow-[0_-16px_32px_-12px_rgba(244,63,94,0.35)]">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-neutral-200" />
              <DiaryPanel
                dateKey={selectedKey}
                phase={phaseByDate[selectedKey]}
                note={notes[selectedKey] || ""}
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
