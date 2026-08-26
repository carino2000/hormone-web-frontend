import { useEffect, useState } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { getAccuracySummary, getModelInfo } from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import { WatchAccuracy } from "../components/devices/WatchScreens";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };
const PHASES = ["Menstrual", "Follicular", "Fertility", "Luteal"];

/**
 * 모델 성능 탭 (P-03).
 *
 * 기존 3탭은 "제품은 이렇게 생깁니다", 이 탭은 "모델은 이만큼 맞힙니다".
 * 대표가 실제로 보고 싶어 하는 건 후자다.
 *
 * ★ 여기 수치는 예측(모델 출력)과 실측(시드 truth)을 비교해 만든 것이다.
 *   실측은 Mira 기기 측정값이고 모델 입력에 들어가지 않았다.
 *   다만 이 참가자가 학습에서 제외됐는지는 모델팀 확인 사항이다 — 제외되지 않았다면
 *   수치가 부풀려지는데 화면이 그걸 알아낼 방법은 없다. 아래 "데이터 출처"에 명시한다.
 */
export default function ModelPerformance({ device, theme }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const totalDays = useSimulationStore((s) => s.totalDays);
  const dataRevision = useSimulationStore((s) => s.dataRevision);

  const key = `${currentDay}|${dataRevision}`;
  const [loaded, setLoaded] = useState({ key: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getAccuracySummary(currentDay), getModelInfo()]).then(
      ([summary, info]) => {
        if (!cancelled) setLoaded({ key, summary, info });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, currentDay]);

  const { summary, info } = loaded;
  const Frame = FRAMES[device];

  // 워치는 숫자 하나 + 링. 표·산점도·혼동행렬은 PC 에 있다.
  if (device === "watch") {
    return (
      <Frame>
        <WatchAccuracy summary={summary} />
      </Frame>
    );
  }

  if (!summary) {
    return (
      <Frame>
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm opacity-60 dark:border-white/5 dark:bg-slate-900">
          <p>아직 평가할 예측이 없습니다.</p>
          <p className="mt-1 text-xs">
            예측이 시작되면 여기에 정확도가 표시됩니다.
          </p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div className="flex flex-col gap-4">
        {/* 요약 */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium opacity-70">평가 구간</h3>
            <span className="text-xs opacity-50">
              Day {summary.firstDay} ~ {summary.lastDay} · {summary.days}일
            </span>
          </div>

          <div className={`mt-4 grid grid-cols-2 gap-4`}>
            <Metric
              label="주기 단계 정확도"
              value={
                summary.phase.accuracy == null
                  ? "—"
                  : `${summary.phase.accuracy.toFixed(1)}%`
              }
              sub={`${summary.phase.hits} / ${summary.phase.n}일 적중`}
            />
            <Metric
              label="LH 상관계수"
              value={fmtCorr(summary.hormones[0].corr)}
              sub="1.0 에 가까울수록 곡선 모양이 일치"
            />
          </div>
        </div>

        {/* 호르몬별 오차 */}
        <div
          className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900`}
        >
          <h3 className="text-sm font-medium opacity-70">호르몬별 오차</h3>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left opacity-50">
                <th className="pb-1 font-medium">호르몬</th>
                <th className="pb-1 text-right font-medium">MAE</th>
                <th className="pb-1 text-right font-medium">평균 오차율</th>
                <th className="pb-1 text-right font-medium">상관계수</th>
                <th className="pb-1 text-right font-medium">표본</th>
              </tr>
            </thead>
            <tbody>
              {summary.hormones.map((h) => (
                <tr
                  key={h.key}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="py-1.5">
                    {h.label}
                    <span className="ml-1 opacity-40">{h.unit}</span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {h.mae == null ? "—" : h.mae.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {h.mape == null ? "—" : `${h.mape.toFixed(1)}%`}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {fmtCorr(h.corr)}
                  </td>
                  <td className="py-1.5 text-right tabular-nums opacity-50">
                    {h.n}일
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] opacity-50">
            MAE = 평균 절대 오차. PdG 는 학습 데이터 결측률이 65%라 표본이 적고
            신뢰도가 낮습니다.
          </p>
        </div>

        {/* 산점도 */}
        <div
          className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900`}
        >
          <h3 className="text-sm font-medium opacity-70">예측값 vs 실측값</h3>
          <p className="mt-1 text-[11px] opacity-50">
            점이 대각선에 가까울수록 정확합니다.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <ScatterPanel
              title="LH"
              data={summary.scatter}
              xKey="lhActual"
              yKey="lh"
              theme={theme}
            />
            <ScatterPanel
              title="Estrogen"
              data={summary.scatter}
              xKey="estrogenActual"
              yKey="estrogen"
              theme={theme}
            />
          </div>
        </div>

        {/* 혼동행렬 */}
        <div
          className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900`}
        >
          <h3 className="text-sm font-medium opacity-70">주기 단계 혼동행렬</h3>
          <p className="mt-1 text-[11px] opacity-50">
            행 = 실측, 열 = 예측. 대각선이 정답입니다.
          </p>
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="opacity-50">
                <th className="pb-1 text-left font-medium">실측 \ 예측</th>
                {PHASES.map((p) => (
                  <th key={p} className="pb-1 text-right font-medium">
                    {p.slice(0, 4)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PHASES.map((actual) => (
                <tr
                  key={actual}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="py-1.5">{actual}</td>
                  {PHASES.map((predicted) => {
                    const n =
                      summary.phase.confusion?.[actual]?.[predicted] ?? 0;
                    const isDiagonal = actual === predicted;
                    return (
                      <td
                        key={predicted}
                        className={`py-1.5 text-right tabular-nums ${
                          n === 0
                            ? "opacity-25"
                            : isDiagonal
                              ? "font-semibold text-emerald-600 dark:text-emerald-400"
                              : "text-rose-500"
                        }`}
                      >
                        {n}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DataProvenance
          modelVersion={info?.modelVersion}
          totalDays={totalDays}
        />
      </div>
    </Frame>
  );
}

// totalDays 를 넘겨받는 이유: 시드 구간이 바뀌면(90일 -> 83일) 이 문구도 같이 바뀌어야
// 하는데, 숫자를 여기 박아두면 조용히 거짓말이 된다. 실제로 한 번 어긋났다.
function DataProvenance({ modelVersion, totalDays }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4 text-[11px] leading-relaxed opacity-70 dark:border-white/5 dark:bg-slate-800/50">
      <p className="font-medium">
        데이터 출처
        {modelVersion && (
          <span className="ml-2 font-normal opacity-60">
            · 모델 {modelVersion}
          </span>
        )}
      </p>
      <p className="mt-1">
        mcPHASES 공개 데이터셋 · 참가자 id_22 · 2024 관측구간 ·{" "}
        {totalDays ?? "—"}일 연속.
        <br />
        실측 호르몬은 Mira 기기 측정값이며{" "}
        <strong>모델 입력에 포함되지 않았습니다.</strong>
        <br />이 참가자는 학습 데이터에서 제외 요청된 검증용 표본입니다.
      </p>
      <p className="mt-2 opacity-80">
        한계: 전체 학습 표본 40명 · PdG 는 2024 구간(20명)에서만 학습 가능 ·
        혈당과 일부 활동 지표는 관측구간에 따라 아예 없습니다.
      </p>
    </div>
  );
}

function Metric({ label, value, sub }) {
  return (
    <div>
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] opacity-50">{sub}</p>
    </div>
  );
}

function ScatterPanel({ title, data, xKey, yKey, theme }) {
  const dark = theme === "dark";
  const points = data.filter((d) => d[xKey] != null && d[yKey] != null);
  if (points.length === 0) {
    return <div className="text-xs opacity-40">{title}: 표본 없음</div>;
  }
  // 여유 5% 를 준 뒤 정수로 올린다. ceil 이 없으면 41.6 * 1.05 = 43.68000000000001 이
  // 그대로 축 눈금에 찍힌다(recharts 는 domain 값을 그대로 라벨로 쓴다).
  const max = Math.ceil(
    Math.max(...points.map((d) => Math.max(d[xKey], d[yKey]))) * 1.05,
  );

  return (
    <div>
      <p className="text-xs opacity-60">{title}</p>
      <div className="mt-1 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={dark ? "#1e293b" : "#eee"}
            />
            <XAxis
              type="number"
              dataKey={xKey}
              name="실측"
              domain={[0, max]}
              fontSize={10}
              tick={{ fill: dark ? "#94a3b8" : "#666" }}
            />
            <YAxis
              type="number"
              dataKey={yKey}
              name="예측"
              domain={[0, max]}
              fontSize={10}
              tick={{ fill: dark ? "#94a3b8" : "#666" }}
            />
            <ZAxis range={[30, 30]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={
                dark
                  ? {
                      background: "#0f172a",
                      border: "1px solid #334155",
                      color: "#e2e8f0",
                    }
                  : undefined
              }
            />
            {/* y = x 기준선. 점이 여기 붙을수록 정확하다 */}
            <ReferenceLine
              segment={[
                { x: 0, y: 0 },
                { x: max, y: max },
              ]}
              stroke={dark ? "#475569" : "#cbd5e1"}
              strokeDasharray="4 4"
            />
            <Scatter
              data={points}
              fill={dark ? "#38bdf8" : "#0ea5e9"}
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function fmtCorr(v) {
  return v == null ? "—" : v.toFixed(3);
}
