/**
 * "오늘 예측을 계산하는 중" 표시.
 *
 * 하루를 넘기면 백엔드는 202 를 즉시 주고 예측은 비동기로 돈다. 그 사이 화면은
 * **직전 예측을 그대로 들고 있는다** — 예전처럼 콜드스타트 화면으로 되돌아가면
 * 이미 쌓인 예측을 앱이 잊어버린 것처럼 보인다.
 *
 * 대신 지금 보이는 게 오늘 것이 아니라는 걸 반드시 밝힌다. 어제 예측을 오늘 것처럼
 * 두면 그건 거짓말이고, 대표 시연에서 들키면 신뢰가 통째로 날아간다.
 */
export default function PendingNotice({ day, predictionDay, error = null, compact = false }) {
  // ★ 실패와 대기를 반드시 구분한다. 내장 Mock 을 제거해서 폴백이 없으므로,
  //   파이썬이 끊기면 예측이 영영 안 온다. 그걸 "계산 중"으로 두면 발표자가
  //   기다리기만 하다가 원인을 못 찾는다.
  const failed = Boolean(error);

  if (compact) {
    return (
      <p className={`text-[10px] ${failed ? "text-rose-500" : "text-amber-600 dark:text-amber-400"}`}>
        <Dot failed={failed} /> Day {day} {failed ? "예측 실패" : "계산 중"}
      </p>
    );
  }

  if (failed) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-rose-300/50 bg-rose-50 px-3 py-2 text-[11px] dark:border-rose-400/30 dark:bg-rose-400/10">
        <span className="font-medium text-rose-700 dark:text-rose-300">
          <Dot failed /> Day {day} 예측에 실패했어요
        </span>
        <span className="text-rose-700/70 dark:text-rose-300/70">{error}</span>
        {predictionDay != null && (
          <span className="text-rose-700/70 dark:text-rose-300/70">
            · 지금 보이는 건 Day {predictionDay} 기준입니다
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-[11px] dark:border-amber-400/30 dark:bg-amber-400/10">
      <span className="font-medium text-amber-700 dark:text-amber-300">
        <Dot /> Day {day} 예측을 계산하는 중이에요
      </span>
      {predictionDay != null && (
        <span className="text-amber-700/70 dark:text-amber-300/70">
          지금 보이는 건 Day {predictionDay} 기준입니다
        </span>
      )}
    </div>
  );
}

function Dot({ failed = false }) {
  return (
    <span
      className={`mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle ${
        failed ? "bg-rose-500" : "animate-pulse bg-amber-500 dark:bg-amber-400"
      }`}
    />
  );
}
