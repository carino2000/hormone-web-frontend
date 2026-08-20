import { DOW_KO, dateKeyOf, getMonthMatrix } from "../../lib/calendarGrid";
import { PHASE_COLOR_CLASS, PHASE_TEXT_ON_COLOR } from "../../lib/phase";

export default function MonthGrid({ cursorDate, phaseByDate, notesByDate, selectedKey, onSelectDate }) {
  const year = cursorDate.getFullYear();
  const month = cursorDate.getMonth() + 1;
  const weeks = getMonthMatrix(year, month);
  const todayKey = dateKeyOf(new Date());

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold">
        {DOW_KO.map((d, i) => (
          <div
            key={d}
            className={
              i === 0
                ? "text-rose-300 dark:text-rose-400/80"
                : i === 6
                  ? "text-sky-300 dark:text-sky-400/80"
                  : "text-neutral-400 dark:text-slate-500"
            }
          >
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((date) => {
              const key = dateKeyOf(date);
              const inMonth = date.getMonth() + 1 === month;
              const phase = inMonth ? phaseByDate[key] : null;
              const hasNote = !!notesByDate[key];
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDate(key)}
                  className="flex flex-col items-center gap-1 py-1.5"
                >
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs transition",
                      phase
                        ? `${PHASE_COLOR_CLASS[phase]} ${PHASE_TEXT_ON_COLOR[phase]} font-semibold`
                        : inMonth
                          ? "font-medium text-neutral-700 hover:bg-rose-50 dark:text-slate-300 dark:hover:bg-white/5"
                          : "font-normal text-neutral-300 dark:text-slate-700",
                      isSelected
                        ? "ring-2 ring-rose-400 ring-offset-2 ring-offset-white dark:ring-amber-400 dark:ring-offset-slate-900"
                        : "",
                      isToday && !isSelected
                        ? "ring-1 ring-neutral-300 ring-offset-1 ring-offset-white dark:ring-slate-600 dark:ring-offset-slate-900"
                        : "",
                    ].join(" ")}
                  >
                    {date.getDate()}
                  </span>
                  <span
                    className={`h-1 w-1 rounded-full ${hasNote ? "bg-rose-400 dark:bg-amber-400" : "bg-transparent"}`}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
