import { useEffect, useState } from "react";
import { getCalendar } from "../api";
import { getDaySnapshot } from "../data/simulationSource";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import CycleCalendar from "../components/cards/CycleCalendar";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function Calendar({ device }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataRevision = useSimulationStore((s) => s.dataRevision);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);

  const [calendar, setCalendar] = useState(null);

  useEffect(() => {
    getCalendar(currentDay).then(setCalendar);
  }, [currentDay, dataRevision]);

  if (!calendar) return null;

  const currentDate = getDaySnapshot(currentDay)?.date;

  const Frame = FRAMES[device];

  if (device === "watch") {
    return (
      <Frame>
        <div className="text-center">
          <p className="text-[10px] opacity-70">오늘의 단계</p>
          <p className="text-sm font-semibold">
            {calendar.today_phase_label_ko ?? `수집 중 ${currentDay}/${coldStartDays}`}
          </p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <CycleCalendar
        calendar={calendar}
        device={device}
        currentDay={currentDay}
        currentDate={currentDate}
        coldStartDays={coldStartDays}
      />
    </Frame>
  );
}
