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
import { AlertTriangle } from "lucide-react";
import { getAccuracySummary, getModelInfo } from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };
const PHASES = ["Menstrual", "Follicular", "Fertility", "Luteal"];

/**
 * 모델 성능 탭 (P-03).
 *
 * 기존 3탭은 "제품은 이렇게 생깁니다", 이 탭은 "모델은 이만큼 맞힙니다".
 * 대표가 실제로 보고 싶어 하는 건 후자다.
 *
 * ★ Mock 일 때는 모든 수치를 회색으로 약화시키고 경고 배너를 띄운다.
 *   Mock 은 실측에 노이즈를 얹는 구조라 잘 맞는 게 당연하고, 이걸 모델 성능으로
 *   제시하면 사실이 아닌 것을 보여주는 것이다.
 */
export default function ModelPerformance({ device, theme }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataRevision = useSimulationStore((s) => s.dataRevision);

  const key = `${currentDay}|${dataRevision}`;
  const [loaded, setLoaded] = useState({ key: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getAccuracySummary(currentDay),
      getModelInfo(),
    ]).then(([summary, info]) => {
      if (!cancelled) setLoaded({ key, summary, info });
    });
    return () => {
      cancelled = true;
    };
  }, [key, currentDay]);

  const { summary, info } = loaded;
  const Frame = FRAMES[device];
  const isMock = info?.isMock ?? true;

  if (device === "watch") {
    return (
      <Frame>
        <div className="text-center">
          <p className="text-[10px] opacity-70">주기 단계 정확도</p>
          <p className="text-sm font-semibold">
            {summary?.phase.accuracy != null ? `${summary.phase.accuracy.toFixed(0)}%` : "—"}
          </p>
        </div>
      </Frame>
    );
  }

  if (!summary) {
    return (
      <Frame>
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm opacity-60 dark:border-white/5 dark:bg-slate-900">
          <p>아직 평가할 예측이 없습니다.</p>
          <p className="mt-1 text-xs">예측이 시작되면 여기에 정확도가 표시됩니다.</p>
        </div>
      </Frame>
    );
  }

  const dim = isMock ? "opacity-55" : "";

  return (
    <Frame>
      <div className="flex flex-col gap-4">
        {isMock && <MockWarning />}

        {/* 요약 */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium opacity-70">평가 구간</h3>
            <span className="text-xs opacity-50">
              Day {summary.firstDay} ~ {summary.lastDay} · {summary.days}일
            </span>
          </div>

          <div className={`mt-4 grid grid-cols-2 gap-4 ${dim}`}>
            <Metric
              label="주기 단계 정확도"
              value={summary.phase.accuracy == null ? "—" : `${summary.phase.accuracy.toFixed(1)}%`}
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
        <div className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900 ${dim}`}>
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
                <tr key={h.key} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-1.5">
                    {h.label}
                    <span className="ml-1 opacity-40">{h.unit}</span>
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{h.mae == null ? "—" : h.mae.toFixed(2)}</td>
                  <td className="py-1.5 text-right tabular-nums">
                    {h.mape == null ? "—" : `${h.mape.toFixed(1)}%`}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{fmtCorr(h.corr)}</td>
                  <td className="py-1.5 text-right tabular-nums opacity-50">{h.n}일</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] opacity-50">
            MAE = 평균 절대 오차. PdG 는 학습 데이터 결측률이 65%라 표본이 적고 신뢰도가 낮습니다.
          </p>
        </div>

        {/* 산점도 */}
        <div className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900 ${dim}`}>
          <h3 className="text-sm font-medium opacity-70">예측값 vs 실측값</h3>
          <p className="mt-1 text-[11px] opacity-50">점이 대각선에 가까울수록 정확합니다.</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <ScatterPanel title="LH" data={summary.scatter} xKey="lhActual" yKey="lh" theme={theme} />
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
        <div className={`rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900 ${dim}`}>
          <h3 className="text-sm font-medium opacity-70">주기 단계 혼동행렬</h3>
          <p className="mt-1 text-[11px] opacity-50">행 = 실측, 열 = 예측. 대각선이 정답입니다.</p>
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
                <tr key={actual} className="border-t border-black/5 dark:border-white/5">
                  <td className="py-1.5">{actual}</td>
                  {PHASES.map((predicted) => {
                    const n = summary.phase.confusion?.[actual]?.[predicted] ?? 0;
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

        <DataProvenance />
      </div>
    </Frame>
  );
}

function MockWarning() {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 dark:border-amber-400/25 dark:bg-amber-400/10 dark:text-amber-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        <strong>아래 수치는 모델 성능이 아닙니다.</strong> 현재 백엔드 내장 Mock 예측기가 동작 중이며,
        이 예측기는 실측값에 오차를 얹어 만드는 구조라 잘 맞는 것이 당연합니다.
        <span className="block opacity-80">
          화면 구조를 보여주기 위한 예시 값입니다. 실제 예측모델을 연결하면 이 배너가 사라집니다.
        </span>
      </p>
    </div>
  );
}

function DataProvenance() {
  return (
    <div className="rounded-2xl border border-black/5 bg-neutral-50 p-4 text-[11px] leading-relaxed opacity-70 dark:border-white/5 dark:bg-slate-800/50">
      <p className="font-medium">데이터 출처</p>
      <p className="mt-1">
        mcPHASES 공개 데이터셋 · 참가자 22 · 2024 관측구간 · 90일 연속.
        <br />
        실측 호르몬은 Mira 기기 측정값이며 <strong>모델 입력에 포함되지 않았습니다.</strong>
        <br />
        이 참가자는 학습 데이터에서 제외 요청된 검증용 표본입니다.
      </p>
      <p className="mt-2 opacity-80">
        한계: 전체 학습 표본 40명 · PdG 는 2024 구간(20명)에서만 학습 가능 · 혈당과 일부 활동 지표는
        관측구간에 따라 아예 없습니다.
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
  const max = Math.max(...points.map((d) => Math.max(d[xKey], d[yKey]))) * 1.05;

  return (
    <div>
      <p className="text-xs opacity-60">{title}</p>
      <div className="mt-1 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={dark ? "#1e293b" : "#eee"} />
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
                dark ? { background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" } : undefined
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
            <Scatter data={points} fill={dark ? "#38bdf8" : "#0ea5e9"} fillOpacity={0.7} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function fmtCorr(v) {
  return v == null ? "—" : v.toFixed(3);
}
