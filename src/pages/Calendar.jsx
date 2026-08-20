import { useEffect, useState } from "react";
import { getCalendar } from "../api";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import CycleCalendar from "../components/cards/CycleCalendar";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function Calendar({ device }) {
  const [calendar, setCalendar] = useState(null);

  useEffect(() => {
    getCalendar().then(setCalendar);
  }, []);

  if (!calendar) return null;

  const Frame = FRAMES[device];

  if (device === "watch") {
    return (
      <Frame>
        <div className="text-center">
          <p className="text-[10px] opacity-70">다음 월경</p>
          <p className="text-sm font-semibold">{calendar.next_period_estimate}</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <CycleCalendar calendar={calendar} />
    </Frame>
  );
}
