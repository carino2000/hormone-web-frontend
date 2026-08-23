import { useEffect, useState } from "react";
import { getModelInfo } from "../api";
import { useSimulationStore } from "../state/simulationStore";

/**
 * 지금 화면의 예측이 무엇으로 계산됐는지 항상 표시한다 (P-03).
 *
 * ★ 이 배지는 장식이 아니라 정직성 장치다.
 *
 * MockPredictionClient 는 실측 정답에 ±8% 노이즈를 얹는 구조라 당연히 잘 맞는다.
 * 그걸 "우리 모델 성능"으로 보여주면 사실이 아닌 것을 보여주는 것이다.
 * 대표가 "이거 진짜 모델이야?"라고 물었을 때 화면을 가리키며 답할 수 있어야 한다.
 *
 * 판정 기준은 백엔드가 내려주는 modelVersion 이다. `mock-` 으로 시작하면 Mock.
 */
export default function DataSourceBadge() {
  const dataRevision = useSimulationStore((s) => s.dataRevision);
  const loadError = useSimulationStore((s) => s.loadError);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getModelInfo()
      .then((v) => !cancelled && setInfo(v))
      .catch(() => !cancelled && setInfo(null));
    return () => {
      cancelled = true;
    };
  }, [dataRevision]);

  const variant = resolve(loadError, info);

  return (
    <span
      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${variant.className}`}
      title={variant.title}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${variant.dot}`} />
      {variant.label}
    </span>
  );
}

function resolve(loadError, info) {
  if (loadError) {
    return {
      label: "백엔드 연결 안 됨",
      dot: "bg-rose-400",
      className: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
      title: "백엔드가 떠 있지 않습니다. ./gradlew bootRun 으로 실행하세요.",
    };
  }
  if (!info?.modelVersion) {
    return {
      label: "예측 대기",
      dot: "bg-sky-400",
      className: "bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-300",
      title: "백엔드에 연결됐지만 아직 예측 결과가 없습니다.",
    };
  }
  if (info.isMock) {
    return {
      label: `Mock 예측기 (${info.modelVersion})`,
      dot: "bg-amber-400",
      className: "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
      title:
        "실제 예측모델이 아닙니다. 파이프라인 검증용 내장 Mock 이며, " +
        "여기 나온 정확도는 모델 성능이 아닙니다.",
    };
  }
  return {
    label: `실제 모델 ${info.modelVersion}`,
    dot: "bg-emerald-400",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    title: "파이썬 예측모델이 실제로 계산한 결과입니다.",
  };
}
