import { useEffect, useState } from "react";
import { getContributions, getHormoneSeries, getNextEvents, isColdStartDay } from "../api";
import { COLD_START_DAYS, useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import HormoneChart from "../components/cards/HormoneChart";
import ContributionBars from "../components/cards/ContributionBars";
import ColdStartCard from "../components/cards/ColdStartCard";
import { formatKoreanDate } from "../lib/formatDate";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function PredictionDetail({ device, theme }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataSource = useSimulationStore((s) => s.dataSource);
  const fastForward = useSimulationStore((s) => s.isPlaying && s.speed >= 4);

  const [series, setSeries] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [nextEvents, setNextEvents] = useState(null);

  useEffect(() => {
    getHormoneSeries(currentDay, dataSource).then(setSeries);
    getContributions(currentDay, dataSource).then(setContributions);
    getNextEvents(currentDay, dataSource).then(setNextEvents);
  }, [currentDay, dataSource]);

  if (!series || !contributions || !nextEvents) return null;

  const Frame = FRAMES[device];
  const coldStart = isColdStartDay(currentDay);

  if (device === "watch") {
    return (
      <Frame>
        {coldStart ? (
          <ColdStartCard day={currentDay} coldStartDays={COLD_START_DAYS} compact fastForward={fastForward} />
        ) : (
          <div className="text-center">
            <p className="text-[10px] opacity-70">{nextEvents.next_event_label}</p>
            <p className="text-sm font-semibold">D-{nextEvents.days_to_next_event}</p>
          </div>
        )}
      </Frame>
    );
  }

  if (coldStart) {
    return (
      <Frame>
        <div className={device === "pc" ? "mx-auto max-w-xl" : ""}>
          <ColdStartCard day={currentDay} coldStartDays={COLD_START_DAYS} fastForward={fastForward} />
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div
        className={
          device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"
        }
      >
        <HormoneChart data={series} theme={theme} fastForward={fastForward} />
        <ContributionBars contributions={contributions} fastForward={fastForward} />
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
          <h3 className="text-sm font-medium opacity-70">다음 이벤트 예측</h3>
          <p className="mt-2 text-sm">
            {nextEvents.next_event_label}: D-{nextEvents.days_to_next_event}
          </p>
          <p className="mt-1 text-sm">
            다음 월경 예상: {formatKoreanDate(nextEvents.next_period.date)}
          </p>
          <p className="mt-1 text-xs opacity-60">
            예상 범위 {formatKoreanDate(nextEvents.next_period.rangeStart)} ~{" "}
            {formatKoreanDate(nextEvents.next_period.rangeEnd)}
          </p>
        </div>
      </div>
    </Frame>
  );
}
