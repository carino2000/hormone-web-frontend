import { useEffect, useState } from "react";
import { getCalendar } from "../api";
import { getDaySnapshot } from "../data/simulationSource";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import { WatchCycle } from "../components/devices/WatchScreens";
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

  // 워치는 한 달 격자 대신 "최근 흐름" 한 줄. 격자는 이 크기에서 안 읽힌다.
  if (device === "watch") {
    return (
      <Frame>
        <WatchCycle calendar={calendar} currentDay={currentDay} />
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
