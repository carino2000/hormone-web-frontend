import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { getAdviceList, getAdviceStatus } from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import { formatKoreanDate } from "../lib/formatDate";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

/**
 * 오늘의 조언 탭.
 *
 * 최근 30일 웨어러블 + 우리 예측을 Claude 에 보내고 받은 생활 조언을 보여준다.
 *
 * ★ 토글이 켜져 있으면 하루 넘길 때마다 자동으로 받는다. 기본은 꺼짐 —
 *   켜는 순간 과금이 시작되므로 사용자가 명시적으로 켜야 한다.
 *
 * ★ 자동재생 중에는 자동 호출을 건너뛴다 (simulationStore.requestAdvice).
 *   4x 로 90일을 돌리면 Claude 를 70번 부르게 되고 응답이 진행을 못 따라간다.
 *
 * ★ 실측 정답은 모델에 보내지 않는다. 실서비스에는 정답이 없다 —
 *   정답을 주면 조언이 정확해 보이지만 그건 시연용 눈속임이다.
 */
export default function Advice({ device }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const adviceEnabled = useSimulationStore((s) => s.adviceEnabled);
  const setAdviceEnabled = useSimulationStore((s) => s.setAdviceEnabled);
  const adviceLoading = useSimulationStore((s) => s.adviceLoading);
  const adviceError = useSimulationStore((s) => s.adviceError);
  const adviceRevision = useSimulationStore((s) => s.adviceRevision);
  const requestAdvice = useSimulationStore((s) => s.requestAdvice);

  const key = `${currentDay}|${adviceRevision}|${adviceLoading}`;
  const [loaded, setLoaded] = useState({ key: null, list: [], status: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAdviceList(), getAdviceStatus()]).then(([list, status]) => {
      if (!cancelled) setLoaded({ key, list, status });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const Frame = FRAMES[device];
  const { list, status } = loaded;
  const featureOff = status && status.enabled === false;
  const today = list[0] ?? null;
  const past = list.slice(1);

  if (device === "watch") {
    return (
      <Frame>
        <div className="text-center">
          <p className="text-[10px] opacity-70">오늘의 조언</p>
          <p className="mt-1 text-[10px] leading-tight opacity-90">
            {adviceLoading ? "받는 중…" : today?.content ? "도착" : "없음"}
          </p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="@container flex flex-col gap-4">
        {/* ---------- 토글 ---------- */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-medium opacity-70">
                <Sparkles className="size-3.5" />
                오늘의 조언
              </h3>
              <p className="mt-1 text-[11px] opacity-55">
                최근 {status?.historyDays ?? 30}일 웨어러블과 예측을 함께 보고 생활 제안을 받습니다
              </p>
            </div>

            <Toggle
              checked={adviceEnabled}
              disabled={featureOff}
              onChange={() => setAdviceEnabled(!adviceEnabled)}
            />
          </div>

          {featureOff ? (
            <p className="mt-4 rounded-xl bg-neutral-50 p-3 text-[11px] leading-relaxed opacity-60 dark:bg-white/5">
              API 키가 설정되지 않아 이 기능이 꺼져 있습니다.
              <br />
              <span className="font-mono">application-local.yaml</span> 의{" "}
              <span className="font-mono">anthropic.api-key</span> 를 채우고 백엔드를 다시 띄우세요.
            </p>
          ) : (
            <p className="mt-4 text-[11px] leading-relaxed text-neutral-500 dark:text-slate-400">
              {adviceEnabled ? (
                <>
                  켜져 있습니다 — <span className="font-medium">하루를 넘길 때마다 자동으로</span> 받습니다.
                  자동재생 중에는 건너뜁니다(호출이 진행 속도를 못 따라갑니다).
                </>
              ) : (
                <>꺼져 있습니다. 켜면 하루를 넘길 때마다 자동으로 조언을 받습니다.</>
              )}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={featureOff || adviceLoading || currentDay < 1}
              onClick={() => requestAdvice({ force: true })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-[11px] transition-colors enabled:hover:bg-black/5 disabled:opacity-30 dark:border-white/10 dark:enabled:hover:bg-white/10"
            >
              {adviceLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5" />
              )}
              {today ? "다시 받기" : "지금 받기"}
            </button>
            {adviceLoading && (
              <span className="text-[11px] opacity-50">
                최근 30일치를 읽는 중이라 15~20초 걸립니다…
              </span>
            )}
          </div>

          {adviceError && (
            <p className="mt-3 rounded-xl bg-rose-50 p-3 text-[11px] text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
              {adviceError}
            </p>
          )}
        </div>

        {/* ---------- 오늘 ---------- */}
        {today ? (
          <AdviceCard advice={today} highlight />
        ) : (
          !featureOff && (
            <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm opacity-60 dark:border-white/5 dark:bg-slate-900">
              <p>아직 받은 조언이 없습니다.</p>
              <p className="mt-1 text-xs">
                {currentDay < 1
                  ? "하루를 넘겨 데이터를 모은 뒤 받을 수 있어요."
                  : "위 토글을 켜거나 “지금 받기”를 눌러 보세요."}
              </p>
            </div>
          )
        )}

        {/* ---------- 지난 조언 ---------- */}
        {past.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-medium opacity-45">지난 조언 {past.length}건</p>
            {past.map((a) => (
              <AdviceCard key={a.id} advice={a} />
            ))}
          </div>
        )}

        {/* ★ 화면 어디서든 이 선을 지운 채로 두지 말 것 */}
        <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-slate-500">
          이 조언은 의료 진단이 아니며, 피임이나 임신 시도의 근거로 쓸 수 없습니다. 호르몬 수치는
          측정값이 아니라 모델의 예측값입니다. 걱정되는 증상이 있으면 전문가와 상의하세요.
        </p>
      </div>
    </Frame>
  );
}

function AdviceCard({ advice, highlight = false }) {
  const failed = advice.status === "FAILED";

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm dark:bg-slate-900 ${
        highlight
          ? "border-indigo-200 bg-white dark:border-sky-400/30"
          : "border-black/5 bg-white dark:border-white/5"
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium">
          {formatKoreanDate(advice.targetDate)}
          {advice.dayInStudy != null && (
            <span className="ml-1.5 text-[11px] opacity-45">Day {advice.dayInStudy}</span>
          )}
        </p>
        {failed ? (
          <span className="rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-500 dark:bg-rose-400/10 dark:text-rose-300">
            실패
          </span>
        ) : (
          <span className="text-[10px] tabular-nums opacity-35">
            {advice.model ?? "—"}
            {advice.inputTokens != null && (
              <> · 입력 {advice.inputTokens.toLocaleString()} / 출력 {advice.outputTokens?.toLocaleString()}</>
            )}
            {advice.latencyMs != null && <> · {(advice.latencyMs / 1000).toFixed(1)}초</>}
          </span>
        )}
      </div>

      {failed ? (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-rose-50 p-3 font-mono text-[10px] text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
          {advice.errorMessage}
        </pre>
      ) : (
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{advice.content}</div>
      )}

      {advice.truncated && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[10px] text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
          길이 상한에 걸려 문장이 잘렸습니다. <span className="font-mono">anthropic.max-tokens</span> 를 올리세요.
        </p>
      )}

      {advice.sentDays != null && !failed && (
        <p className="mt-3 text-[10px] opacity-35">
          최근 {advice.sentDays}일 × 웨어러블 {advice.sentFeatures}개 + 예측 이력을 보고 작성됨
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label="오늘의 조언 자동 받기"
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-30 ${
        checked ? "bg-indigo-500 dark:bg-sky-500" : "bg-neutral-200 dark:bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}
