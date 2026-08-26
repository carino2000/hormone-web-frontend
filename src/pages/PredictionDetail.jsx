import { useEffect, useState } from "react";
import {
  getAccuracyToday,
  getContributions,
  getHormoneSeries,
  getModelInputs,
  getTodayPrediction,
  getWearableSeries,
} from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import { WatchHormones } from "../components/devices/WatchScreens";
import HormoneChart from "../components/cards/HormoneChart";
import WearableSignalChart from "../components/cards/WearableSignalChart";
import AccuracyCard from "../components/cards/AccuracyCard";
import ContributionBars from "../components/cards/ContributionBars";
import ColdStartCard from "../components/cards/ColdStartCard";
import ModelInputPanel from "../components/cards/ModelInputPanel";
import PendingNotice from "../components/PendingNotice";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function PredictionDetail({ device, theme }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataRevision = useSimulationStore((s) => s.dataRevision);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);
  const predictionError = useSimulationStore((s) => s.predictionError);
  const fastForward = useSimulationStore((s) => s.isPlaying && s.speed >= 4);

  const key = `${currentDay}|${dataRevision}`;
  const [loaded, setLoaded] = useState({ key: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getHormoneSeries(currentDay),
      getWearableSeries(currentDay),
      getContributions(currentDay),
      getTodayPrediction(currentDay),
      getAccuracyToday(currentDay),
      getModelInputs(currentDay),
    ]).then(
      ([series, wearable, contributions, today, accuracy, modelInputs]) => {
        if (!cancelled) {
          setLoaded({
            key,
            series,
            wearable,
            contributions,
            today,
            accuracy,
            modelInputs,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, currentDay]);

  const { series, wearable, contributions, today, accuracy, modelInputs } =
    loaded;
  const Frame = FRAMES[device];

  if (!series) {
    return (
      <Frame>
        <div className="h-64 animate-pulse rounded-2xl border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5" />
      </Frame>
    );
  }

  // ★ today 는 pending 일 때 직전 예측으로 대체돼 온다(api/index.js getTodayPrediction).
  //   null 이면 진짜로 한 번도 예측이 없었던 것 = 콜드스타트다.
  const coldStart = !today;
  const pending = today?.isPending === true;

  // 워치는 "오늘 수치가 얼마인가" 하나만 답한다. 곡선·기여도·44개 패널은 폰에 있다.
  if (device === "watch") {
    return (
      <Frame>
        <WatchHormones accuracy={accuracy} coldStart={coldStart} />
      </Frame>
    );
  }

  // ★ PC/모바일 콜드스타트. 이게 없으면 아래에서 today.phase_label_ko 를 읽다가
  //   today 가 null 이라 화면이 통째로 죽는다(실제로 한 번 그랬다).
  if (coldStart) {
    return (
      <Frame>
        {/* 수집 구간에도 입력 패널을 보여준다. "예측은 아직 없지만 신호는 44개가
            매일 쌓이고 있다"가 콜드스타트 서사의 핵심이라 여기가 오히려 잘 맞는다. */}
        <div
          className={`flex flex-col gap-4 ${device === "pc" ? "mx-auto max-w-xl" : ""}`}
        >
          <ColdStartCard
            day={currentDay}
            coldStartDays={coldStartDays}
            fastForward={fastForward}
          />
          <ModelInputPanel inputs={modelInputs} />
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex flex-col gap-4">
        {pending && (
          <PendingNotice
            day={currentDay}
            predictionDay={today.predictionDay}
            error={
              predictionError?.day === currentDay
                ? predictionError.message
                : null
            }
          />
        )}
        {/* 호르몬 곡선과 웨어러블 신호는 반드시 세로로 붙인다.
            좌우로 놓으면 X축이 정렬되지 않아 "서지 시점에 HRV가 떨어진다"는 대응이 안 보인다. */}
        <HormoneChart
          data={series}
          theme={theme}
          fastForward={fastForward}
          device={device}
        />
        <WearableSignalChart
          data={wearable}
          theme={theme}
          fastForward={fastForward}
          device={device}
        />
        {/* 차트가 신호 2개를 보여준 직후에 온다 — "차트에 둘만 그린 거지 모델은 44개를
            먹는다"는 대비가 이 순서에서만 산다. */}
        <ModelInputPanel inputs={modelInputs} />

        <div
          className={
            device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"
          }
        >
          <AccuracyCard accuracy={accuracy} />
          {/* 기여도는 모델팀이 "못 준다"고 한 값이다 (모델 4개가 CNN/MixedLM/스태킹/T-LSTM
              으로 제각각이라 통일된 형태로 뽑기 어렵다고). 그래서 평소엔 이 카드가 안 뜬다.
              ★ 컴포넌트를 지우지 않고 조건부로만 둔 이유: 나중에 모델이 주기 시작하면
                코드 수정 없이 그대로 다시 나타난다. 빈 배열이면 제목만 있는 빈 카드가
                떠서 "고장난 화면"으로 보이므로 그때는 렌더하지 않는다. */}
          {contributions.length > 0 && (
            <ContributionBars
              contributions={contributions}
              fastForward={fastForward}
            />
          )}
          {/* 예전엔 "다음 이벤트 예측"(다음 월경 D-day) 카드였다. 모델이 오늘자 phase 만
              준다고 해서 그 기능을 뺐고, 자리를 비우면 2열 그리드가 출렁이므로
              모델이 실제로 주는 것(단계·확신도·버전)을 보여주는 카드로 바꿨다. */}
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
            <h3 className="text-sm font-medium opacity-70">오늘의 예측</h3>
            <p className="mt-2 text-2xl font-semibold">
              {today.phase_label_ko ?? "—"}
            </p>
            {today.confidence != null && (
              <p className="mt-1 text-sm opacity-60">
                확신도 {Math.round(today.confidence * 100)}%
              </p>
            )}
            <p className="mt-3 text-[11px] opacity-40">
              모델 {today.modelVersion ?? "—"}
            </p>
          </div>
        </div>
      </div>
    </Frame>
  );
}
