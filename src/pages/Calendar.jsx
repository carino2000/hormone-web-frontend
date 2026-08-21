import { useEffect, useState } from "react";
import { getCalendar } from "../api";
import { getDaySnapshot } from "../data/simulationSource";
import { COLD_START_DAYS, useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import CycleCalendar from "../components/cards/CycleCalendar";
import { formatKoreanDate } from "../lib/formatDate";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function Calendar({ device }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataSource = useSimulationStore((s) => s.dataSource);

  const [calendar, setCalendar] = useState(null);

  useEffect(() => {
    getCalendar(currentDay, dataSource).then(setCalendar);
  }, [currentDay, dataSource]);

  if (!calendar) return null;

  const currentDate = getDaySnapshot(currentDay, { dataSource })?.date;

  const Frame = FRAMES[device];

  if (device === "watch") {
    return (
      <Frame>
        <div className="text-center">
          <p className="text-[10px] opacity-70">다음 월경</p>
          <p className="text-sm font-semibold">
            {calendar.next_period_estimate ? formatKoreanDate(calendar.next_period_estimate) : `수집 중 ${currentDay}/${COLD_START_DAYS}`}
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
        coldStartDays={COLD_START_DAYS}
      />
    </Frame>
  );
}
