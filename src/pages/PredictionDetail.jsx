import { useEffect, useState } from "react";
import {
  getAccuracyToday,
  getContributions,
  getHormoneSeries,
  getModelInputs,
  getNextEvents,
  getWearableSeries,
} from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import HormoneChart from "../components/cards/HormoneChart";
import WearableSignalChart from "../components/cards/WearableSignalChart";
import AccuracyCard from "../components/cards/AccuracyCard";
import ContributionBars from "../components/cards/ContributionBars";
import ColdStartCard from "../components/cards/ColdStartCard";
import ModelInputPanel from "../components/cards/ModelInputPanel";
import PendingNotice from "../components/PendingNotice";
import { formatKoreanDate } from "../lib/formatDate";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function PredictionDetail({ device, theme }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataRevision = useSimulationStore((s) => s.dataRevision);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);
  const fastForward = useSimulationStore((s) => s.isPlaying && s.speed >= 4);

  const key = `${currentDay}|${dataRevision}`;
  const [loaded, setLoaded] = useState({ key: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getHormoneSeries(currentDay),
      getWearableSeries(currentDay),
      getContributions(currentDay),
      getNextEvents(currentDay),
      getAccuracyToday(currentDay),
      getModelInputs(currentDay),
    ]).then(([series, wearable, contributions, nextEvents, accuracy, modelInputs]) => {
      if (!cancelled) {
        setLoaded({ key, series, wearable, contributions, nextEvents, accuracy, modelInputs });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [key, currentDay]);

  const { series, wearable, contributions, nextEvents, accuracy, modelInputs } = loaded;
  const Frame = FRAMES[device];

  if (!series) {
    return (
      <Frame>
        <div className="h-64 animate-pulse rounded-2xl border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5" />
      </Frame>
    );
  }

  // ★ nextEvents 는 pending 일 때 직전 예측으로 대체돼 온다(api/index.js getNextEvents).
  //   null 이면 진짜로 한 번도 예측이 없었던 것 = 콜드스타트다.
  const coldStart = !nextEvents;
  const pending = nextEvents?.isPending === true;

  if (device === "watch") {
    return (
      <Frame>
        {coldStart ? (
          <ColdStartCard day={currentDay} coldStartDays={coldStartDays} compact fastForward={fastForward} />
        ) : (
          <div className="text-center">
            <p className="text-[10px] opacity-70">{nextEvents.next_event_label}</p>
            <p className="text-sm font-semibold">D-{nextEvents.days_to_next_event}</p>
            {pending && (
              <PendingNotice day={currentDay} predictionDay={nextEvents.predictionDay} compact />
            )}
          </div>
        )}
      </Frame>
    );
  }

  if (coldStart) {
    return (
      <Frame>
        {/* 수집 구간에도 입력 패널을 보여준다. "예측은 아직 없지만 신호는 44개가
            매일 쌓이고 있다"가 콜드스타트 서사의 핵심이라 여기가 오히려 잘 맞는다. */}
        <div className={`flex flex-col gap-4 ${device === "pc" ? "mx-auto max-w-xl" : ""}`}>
          <ColdStartCard day={currentDay} coldStartDays={coldStartDays} fastForward={fastForward} />
          <ModelInputPanel inputs={modelInputs} />
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex flex-col gap-4">
        {pending && <PendingNotice day={currentDay} predictionDay={nextEvents.predictionDay} />}
        {/* 호르몬 곡선과 웨어러블 신호는 반드시 세로로 붙인다.
            좌우로 놓으면 X축이 정렬되지 않아 "서지 시점에 HRV가 떨어진다"는 대응이 안 보인다. */}
        <HormoneChart data={series} theme={theme} fastForward={fastForward} />
        <WearableSignalChart data={wearable} theme={theme} fastForward={fastForward} />
        {/* 차트가 신호 2개를 보여준 직후에 온다 — "차트에 둘만 그린 거지 모델은 44개를
            먹는다"는 대비가 이 순서에서만 산다. */}
        <ModelInputPanel inputs={modelInputs} />

        <div className={device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
          <AccuracyCard accuracy={accuracy} />
          <ContributionBars contributions={contributions} fastForward={fastForward} />
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
            <h3 className="text-sm font-medium opacity-70">다음 이벤트 예측</h3>
            <p className="mt-2 text-sm">
              {nextEvents.next_event_label}: D-{nextEvents.days_to_next_event}
            </p>
            {nextEvents.next_period && (
              <>
                <p className="mt-1 text-sm">
                  다음 월경 예상: {formatKoreanDate(nextEvents.next_period.date)}
                </p>
                <p className="mt-1 text-xs opacity-60">
                  예상 범위 {formatKoreanDate(nextEvents.next_period.rangeStart)} ~{" "}
                  {formatKoreanDate(nextEvents.next_period.rangeEnd)}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </Frame>
  );
}
