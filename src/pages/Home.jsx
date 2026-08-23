import { useEffect, useState } from "react";
import { getModelInputs, getPredictionSummary, getVitals } from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import PredictionSummaryCard from "../components/cards/PredictionSummaryCard";
import VitalsSummary from "../components/cards/VitalsSummary";
import ColdStartCard from "../components/cards/ColdStartCard";
import ModelInputPanel from "../components/cards/ModelInputPanel";
import SafetyNotice from "../components/SafetyNotice";
import PendingNotice from "../components/PendingNotice";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

export default function Home({ device }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const fastForward = useSimulationStore((s) => s.isPlaying && s.speed >= 4);
  const dataRevision = useSimulationStore((s) => s.dataRevision);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);

  // 로딩 상태를 effect 안에서 setState 로 만들지 않는다 (react-hooks/set-state-in-effect).
  // 대신 "어떤 키의 데이터를 들고 있는가"를 저장하고, 현재 키와 다르면 로딩으로 친다.
  const key = `${currentDay}|${dataRevision}`;
  const [loaded, setLoaded] = useState({ key: null, summary: null, vitals: null, inputs: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getPredictionSummary(currentDay),
      getVitals(currentDay),
      getModelInputs(currentDay),
    ]).then(([s, v, i]) => {
      if (!cancelled) setLoaded({ key, summary: s, vitals: v, inputs: i });
    });
    return () => {
      cancelled = true;
    };
  }, [key, currentDay]);

  const loading = loaded.key !== key;
  const summary = loaded.summary;
  const vitals = loaded.vitals;
  const inputs = loaded.inputs;

  const Frame = FRAMES[device];

  // 로딩 중에도 화면이 하얗게 사라지지 않게 스켈레톤을 보여준다
  if (loading && !summary) {
    return (
      <Frame>
        <Skeleton device={device} />
      </Frame>
    );
  }
  if (!summary || !vitals) {
    return (
      <Frame>
        <EmptyState />
      </Frame>
    );
  }

  // ★ 콜드스타트는 "예측이 한 번도 없었다"일 때만이다. "오늘 것이 아직 안 왔다"는
  //   pending 이고, 그때는 직전 예측을 그대로 들고 있는다 — 안 그러면 하루 넘길 때마다
  //   화면이 수집 화면으로 되돌아갔다 온다. getPredictionSummary 가 이미 직전 예측으로
  //   대체해서 주므로 여기서는 isColdStart 만 보면 된다.
  const coldStart = summary.isColdStart === true;
  const pending = summary.isPending === true;

  if (device === "watch") {
    return (
      <Frame>
        {coldStart ? (
          <ColdStartCard day={currentDay} coldStartDays={coldStartDays} compact fastForward={fastForward} />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <PredictionSummaryCard summary={summary} compact fastForward={fastForward} />
            {pending && <PendingNotice day={currentDay} predictionDay={summary.predictionDay} compact />}
            <SafetyNotice compact />
          </div>
        )}
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex flex-col gap-4">
        {pending && <PendingNotice day={currentDay} predictionDay={summary.predictionDay} />}
        <div className={device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
          {coldStart ? (
            <ColdStartCard
              day={currentDay}
              coldStartDays={coldStartDays}
              wearable={vitals && toRawWearable(vitals)}
              fastForward={fastForward}
            />
          ) : (
            <PredictionSummaryCard summary={summary} fastForward={fastForward} />
          )}
          <VitalsSummary vitals={vitals} fastForward={fastForward} />
        </div>

        {/* 위 6칸은 훑어보는 요약이고, 이건 그 아래에서 44개를 전부 편다.
            접힌 상태로 시작한다 — 홈에 처음 들어왔을 때 44칸이 펼쳐져 있으면
            제품 화면이 아니라 계기판 덤프로 보인다. 점 격자만으로도 규모는 전달된다. */}
        <ModelInputPanel inputs={inputs} variant="body" />

        {/* 예측이 보이는 자리에 같이 둔다 — 푸터 구석에 두면 아무도 안 본다 */}
        {!coldStart && <SafetyNotice />}
      </div>
    </Frame>
  );
}

// VitalsSummary 는 {value, baseline, unit} 형태를 쓰지만 ColdStartCard 미니 티저는
// 오늘 값(value)만 필요하다 — 여기서 한 번만 풀어서 넘긴다.
function toRawWearable(vitals) {
  return Object.fromEntries(Object.entries(vitals).map(([k, v]) => [k, v.value]));
}

function Skeleton({ device }) {
  return (
    <div className={device === "pc" ? "grid grid-cols-2 gap-4" : "flex flex-col gap-4"}>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-2xl border border-black/5 bg-black/5 dark:border-white/5 dark:bg-white/5"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm opacity-60 dark:border-white/5 dark:bg-slate-900">
      <p>아직 표시할 데이터가 없습니다.</p>
      <p className="mt-1 text-xs">시뮬레이터에서 &quot;하루 넘기기&quot;를 눌러 시작하세요.</p>
    </div>
  );
}
