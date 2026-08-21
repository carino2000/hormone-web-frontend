import { useEffect, useState } from "react";
import { getPredictionSummary, getVitals, isColdStartDay } from "../api";
import { COLD_START_DAYS, useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import PredictionSummaryCard from "../components/cards/PredictionSummaryCard";
import VitalsSummary from "../components/cards/VitalsSummary";
import ColdStartCard from "../components/cards/ColdStartCard";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function Home({ device }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataSource = useSimulationStore((s) => s.dataSource);
  const fastForward = useSimulationStore((s) => s.isPlaying && s.speed >= 4);

  const [summary, setSummary] = useState(null);
  const [vitals, setVitals] = useState(null);

  useEffect(() => {
    getPredictionSummary(currentDay, dataSource).then(setSummary);
    getVitals(currentDay, dataSource).then(setVitals);
  }, [currentDay, dataSource]);

  if (!summary || !vitals) return null;

  const Frame = FRAMES[device];
  const coldStart = isColdStartDay(currentDay);

  if (device === "watch") {
    return (
      <Frame>
        {coldStart ? (
          <ColdStartCard day={currentDay} coldStartDays={COLD_START_DAYS} compact fastForward={fastForward} />
        ) : (
          <PredictionSummaryCard summary={summary} compact fastForward={fastForward} />
        )}
      </Frame>
    );
  }

  return (
    <Frame>
      <div className={device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        {coldStart ? (
          <ColdStartCard day={currentDay} coldStartDays={COLD_START_DAYS} wearable={vitals && toRawWearable(vitals)} fastForward={fastForward} />
        ) : (
          <PredictionSummaryCard summary={summary} fastForward={fastForward} />
        )}
        <VitalsSummary vitals={vitals} fastForward={fastForward} />
      </div>
    </Frame>
  );
}

// VitalsSummary는 {value, baseline, unit} 형태를 쓰지만 ColdStartCard 미니 티저는
// 오늘 값(value)만 필요하다 — 여기서 한 번만 풀어서 넘긴다.
function toRawWearable(vitals) {
  return Object.fromEntries(Object.entries(vitals).map(([k, v]) => [k, v.value]));
}
