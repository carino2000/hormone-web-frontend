import { useState } from "react";

/**
 * 웨어러블 44개 전체 패널.
 *
 * 같은 데이터를 두 화면에서 다른 이름으로 쓴다. 보는 사람이 다르고, 답하는 질문이 다르다.
 *
 *   variant="body"  (홈)      "어제 하루 내 몸이 어땠나"     → 사용자 관점
 *   variant="model" (예측 상세) "웨어러블에서 몇 개나 쓰나"    → 대표/모델팀 관점
 *
 * 홈의 "오늘의 생체신호" 6칸은 훑어보는 요약이고, 이 패널은 그 아래에서 전체를 편다.
 * 6칸만 있으면 6개만 쓰는 것처럼 보이는데, 실제로는 44개가 매일 들어온다.
 *
 * ★ 결측 칸을 숨기지 않는다. 지우면 44개를 매일 다 채워 넣는 것처럼 보이는데
 *   사실이 아니다 — 이 참가자는 하루 38~41개고, 혈당 2종과 좌식시간은
 *   90일 내내 비어 있다. 결측이 예외가 아니라 기본 상태라는 게 이 데이터의 성격이고,
 *   그걸 화면에서 지우면 모델팀에 잘못된 기대를 만든다.
 */
export default function ModelInputPanel({ inputs, defaultOpen = false, variant = "model" }) {
  const [open, setOpen] = useState(defaultOpen);
  if (!inputs) return null;

  const { wearableCount, staticCount, totalCount, measured, missing, groups, beforeStart } = inputs;
  const pct = wearableCount ? Math.round((measured / wearableCount) * 100) : 0;
  const isBody = variant === "body";

  return (
    // @container: 열 개수를 뷰포트가 아니라 "이 카드의 폭"으로 정한다.
    // sm:/lg: 를 쓰면 PC 창(1280px) 안에서 모바일 프레임(카드 폭 ~284px)을 볼 때도
    // 4열이 유지돼서 라벨이 22개나 잘렸다. 기기 프레임 토글이 있는 화면이라
    // 뷰포트 기준 브레이크포인트는 여기서 항상 틀린다.
    <div className="@container rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium opacity-70">
          {isBody ? "지난 하루 몸 상태 — 전체 신호" : "모델 입력 신호"}
        </h3>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg px-2 py-1 text-xs opacity-60 transition-opacity hover:opacity-100"
        >
          {open ? "접기" : "전체 보기"}
        </button>
      </div>

      {isBody ? (
        <>
          <p className="mt-2 text-sm">
            <span className="text-2xl font-semibold tabular-nums">{measured}</span>
            <span className="ml-1.5 text-xs opacity-60">
              개 신호가 들어왔어요 (전체 {wearableCount}개 중)
            </span>
          </p>
          <p className="mt-1 text-[11px] opacity-60">
            {beforeStart ? (
              <>아직 수집 전이에요 — 하루가 지나면 첫 신호가 들어옵니다</>
            ) : missing > 0 ? (
              <>
                <span className="tabular-nums">{missing}</span>개는 어제 측정되지 않았어요
              </>
            ) : (
              <>어제는 모든 신호가 측정됐어요</>
            )}
          </p>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm">
            <span className="text-2xl font-semibold tabular-nums">{totalCount}</span>
            <span className="ml-1.5 text-xs opacity-60">
              개 = 웨어러블 {wearableCount} + 정적 {staticCount}
            </span>
          </p>
          <p className="mt-1 text-[11px] opacity-60">
            {beforeStart ? (
              <>수집 시작 전 — 하루가 지나야 첫 신호가 들어온다</>
            ) : (
              <>
                오늘 측정된 신호{" "}
                <span className="font-medium tabular-nums">{measured}</span>/{wearableCount}개
                {missing > 0 && <> · 결측 <span className="tabular-nums">{missing}</span>개</>}
              </>
            )}
          </p>
        </>
      )}

      {/* 측정/결측 비율 막대 */}
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-indigo-400 transition-[width] duration-500 dark:bg-sky-400"
          style={{ width: `${pct}%` }}
        />
      </div>

      {open ? (
        <div className="mt-5 flex flex-col gap-4">
          {groups.map((g) => (
            <section key={g.name}>
              <p className="text-[11px] font-medium opacity-50">
                {g.name}
                <span className="ml-1.5 tabular-nums opacity-70">{g.items.length}</span>
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 @[26rem]:grid-cols-3 @[40rem]:grid-cols-4">
                {g.items.map((it) => (
                  <SignalCell key={it.key} item={it} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        // 접힌 상태에서도 규모가 보이게 44칸을 점으로 깐다
        <div className="mt-4 flex flex-wrap gap-1">
          {groups.flatMap((g) =>
            g.items.map((it) => (
              <span
                key={it.key}
                title={`${it.label}${it.measured ? "" : " — 측정 안 됨"}`}
                className={`h-2.5 w-2.5 rounded-[3px] ${
                  it.measured
                    ? "bg-indigo-400 dark:bg-sky-400"
                    : "bg-neutral-200 dark:bg-white/10"
                }`}
              />
            )),
          )}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-neutral-500 dark:text-slate-400">
        {beforeStart ? (
          <>
            수면·피부온도·HRV 는 <span className="font-medium">하룻밤이 지나야</span> 확정되는
            값이라, 시작 시점에는 44개가 모두 비어 있습니다.
          </>
        ) : isBody ? (
          <>
            시계를 차고 있는 동안 모인 신호 전부입니다. 회색 칸은 어제 측정되지 않은 항목이에요 —
            <span className="font-medium"> 비어 있어도 예측은 그대로 돌아갑니다.</span>{" "}
            강조된 칸은 위 요약에 띄운 6개입니다.
          </>
        ) : (
          <>
            회색 칸은 그날 측정되지 않은 신호입니다.{" "}
            <span className="font-medium">결측은 0으로 채우지 않고 비운 채로 모델에 전달합니다</span> —
            웨어러블 데이터는 결측이 예외가 아니라 기본 상태라서, &quot;측정 안 됨&quot;과
            &quot;값이 0&quot;을 모델이 구분할 수 있어야 합니다.
          </>
        )}
      </p>
    </div>
  );
}

function SignalCell({ item }) {
  const { label, value, unit, decimals, measured, isHomeTile } = item;

  return (
    <div
      className={`rounded-lg px-2.5 py-2 ${
        measured
          ? isHomeTile
            ? "bg-indigo-50 dark:bg-sky-400/10"
            : "bg-neutral-50 dark:bg-white/5"
          : "bg-neutral-50/60 dark:bg-white/[0.02]"
      }`}
    >
      <p className={`truncate text-[10px] ${measured ? "opacity-60" : "opacity-35"}`} title={label}>
        {label}
      </p>
      {measured ? (
        <p className="truncate text-sm font-semibold tabular-nums">
          {value.toFixed(decimals)}
          {unit && <span className="ml-0.5 text-[10px] font-normal opacity-55">{unit}</span>}
        </p>
      ) : (
        <p className="text-sm font-semibold opacity-25">—</p>
      )}
    </div>
  );
}
