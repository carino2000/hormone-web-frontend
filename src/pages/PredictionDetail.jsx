import { useEffect, useState } from "react";
import { getContributions, getHormoneSeries, getNextEvents } from "../api";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import HormoneChart from "../components/cards/HormoneChart";
import ContributionBars from "../components/cards/ContributionBars";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function PredictionDetail({ device }) {
  const [series, setSeries] = useState(null);
  const [contributions, setContributions] = useState(null);
  const [nextEvents, setNextEvents] = useState(null);

  useEffect(() => {
    getHormoneSeries().then(setSeries);
    getContributions().then(setContributions);
    getNextEvents().then(setNextEvents);
  }, []);

  if (!series || !contributions || !nextEvents) return null;

  const Frame = FRAMES[device];

  if (device === "watch") {
    return (
      <Frame>
        <div className="text-center">
          <p className="text-[10px] opacity-70">LH Surge 예상</p>
          <p className="text-sm font-semibold">{nextEvents.lh_surge_expected}</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className={device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
        <HormoneChart data={series} />
        <ContributionBars contributions={contributions} />
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium opacity-70">다음 이벤트 예측</h3>
          <p className="mt-2 text-sm">LH surge 예상: {nextEvents.lh_surge_expected}</p>
          <p className="mt-1 text-sm">
            가임 윈도우 확률: {Math.round(nextEvents.fertility_window_prob * 100)}%
          </p>
        </div>
      </div>
    </Frame>
  );
}
