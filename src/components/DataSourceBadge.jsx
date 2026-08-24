import { useEffect, useState } from "react";
import { getModelInfo } from "../api";
import { useSimulationStore } from "../state/simulationStore";

/**
 * 지금 화면의 예측이 무엇으로 계산됐는지 항상 표시한다 (P-03).
 *
 * ★ 이 배지는 장식이 아니다. 대표가 "이거 진짜 모델이야?"라고 물었을 때
 * 화면을 가리키며 답할 수 있어야 한다.
 *
 * 표시하는 건 백엔드가 내려주는 modelVersion 이다. 모델팀이 이 값을 안 주면
 * "예측 대기"로 남아서 어느 버전이 돌고 있는지 알 수 없다 — 계약에서 요청한 이유다.
 *
 * (내장 Mock 을 쓰던 시절에는 여기서 Mock 여부를 구분해 경고를 띄웠다.
 *  Mock 을 제거하면서 그 분기도 같이 지웠다.)
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
  return {
    label: `예측모델 ${info.modelVersion}`,
    dot: "bg-emerald-400",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300",
    title: "파이썬 예측모델이 실제로 계산한 결과입니다.",
  };
}
