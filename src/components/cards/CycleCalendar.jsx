import { PHASE_COLOR_CLASS } from "../../lib/phase";

export default function CycleCalendar({ calendar }) {
  const phaseByDate = Object.fromEntries(calendar.days.map((d) => [d.date, d.phase]));
  const [year, month] = calendar.month.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium opacity-70">{calendar.month} 주기 달력</h3>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = `${calendar.month}-${String(day).padStart(2, "0")}`;
          const phase = phaseByDate[date];
          return (
            <div
              key={date}
              className={`flex h-8 items-center justify-center rounded-lg text-xs ${
                phase ? PHASE_COLOR_CLASS[phase] : "bg-neutral-50 text-neutral-400"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-sm">
        다음 월경 예상: {calendar.next_period_estimate}
      </p>
    </div>
  );
}
