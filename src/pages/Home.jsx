import { useEffect, useState } from "react";
import { getPredictionSummary, getVitals } from "../api";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import PredictionSummaryCard from "../components/cards/PredictionSummaryCard";
import VitalsSummary from "../components/cards/VitalsSummary";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function Home({ device }) {
  const [summary, setSummary] = useState(null);
  const [vitals, setVitals] = useState(null);

  useEffect(() => {
    getPredictionSummary().then(setSummary);
    getVitals().then(setVitals);
  }, []);

  if (!summary || !vitals) return null;

  const Frame = FRAMES[device];

  if (device === "watch") {
    return (
      <Frame>
        <PredictionSummaryCard summary={summary} compact />
      </Frame>
    );
  }

  return (
    <Frame>
      <div className={device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        <PredictionSummaryCard summary={summary} />
        <VitalsSummary vitals={vitals} />
      </div>
    </Frame>
  );
}
