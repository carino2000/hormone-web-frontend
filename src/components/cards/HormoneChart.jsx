import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSimulationStore } from "../../state/simulationStore";
import { getChartWindow, sliceToWindow } from "../../lib/chartWindow";

// data: [{day, date, lh, estrogen, pdg, lhActual, estrogenActual, pdgActual}, ...]
//
// 콜드스타트 구간(day < coldStartDays)은 예측값이 전부 null이라 그래프 위에 아무 선도
// 그려지지 않는 "빈 구간"으로 남는다. 이게 의도된 연출이다: 하루씩 넘기다 예측 시작일에
// 점 하나가 처음 찍히고, 이후 오른쪽으로 곡선이 자라난다.
//
// X축 domain은 currentDay가 아니라 전체 시뮬레이션 길이(1~totalDays)로 고정한다 —
// 매번 축이 다시 스케일링되면 "자라나는" 느낌 대신 그래프가 계속 흔들리는 것처럼 보인다.
//
// ★ *Actual은 실측 정답이다(P-01). 예측선과 겹쳐 그려서 "예쁜 대시보드"가 아니라
//   "맞히는 모델"임을 보여준다. 예측이 주인공이므로 실측은 가늘고 흐리게 깐다.
export default function HormoneChart({ data, theme = "light", fastForward = false, device = "pc" }) {
  const totalDays = useSimulationStore((s) => s.totalDays);
  const currentDay = useSimulationStore((s) => s.currentDay);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);

  // ★ 두 차트가 같은 헬퍼를 부른다. 각자 계산하면 언젠가 어긋난다(lib/chartWindow.js).
  const win = getChartWindow({ currentDay, totalDays, coldStartDays, device });
  const view = sliceToWindow(data, win);
  const dark = theme === "dark";
  const gridStroke = dark ? "#1e293b" : "#eee";
  const tickColor = dark ? "#94a3b8" : "#666";

  // 실측 데이터가 하나라도 있어야 토글을 보여준다 (콜드스타트 구간에선 비교 대상이 없다)
  const hasActual = data.some((d) => d.lhActual != null || d.estrogenActual != null);
  const [showActual, setShowActual] = useState(true);

  const COLORS = {
    lh: dark ? "#fb923c" : "#fb7cac",
    estrogen: dark ? "#34d399" : "#6ee7b7",
    pdg: dark ? "#facc15" : "#c4b5fd",
  };

  // 실측선: 같은 색을 쓰되 가늘고 반투명하게. 색을 바꾸면 어느 호르몬의 실측인지 헷갈린다.
  const actualLine = (yAxisId, key, color, name) => (
    <Line
      yAxisId={yAxisId}
      type="monotone"
      dataKey={key}
      name={name}
      stroke={color}
      strokeOpacity={0.45}
      strokeWidth={1.5}
      strokeDasharray="2 3"
      dot={false}
      isAnimationActive={false}
      connectNulls
    />
  );

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium opacity-70">호르몬 추정 곡선</h3>
        {hasActual && (
          <button
            type="button"
            onClick={() => setShowActual((v) => !v)}
            aria-pressed={showActual}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              showActual
                ? "border-transparent bg-neutral-900 text-white dark:bg-slate-700"
                : "border-black/10 opacity-60 hover:opacity-100 dark:border-white/15"
            }`}
          >
            실측값 {showActual ? "숨기기" : "보기"}
          </button>
        )}
      </div>

      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={view}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[win.from, win.to]}
              ticks={win.ticks}
              tickFormatter={(d) => `D${d}`}
              fontSize={12}
              tick={{ fill: tickColor }}
            />
            {/* estrogen(0~640)이 lh(0~186)·pdg(1~30)보다 값 범위가 훨씬 커서 축을 공유하면
                LH 서지처럼 중요한 변화가 눌려서 안 보인다 — 보조 축으로 분리 */}
            <YAxis yAxisId="estrogen" fontSize={12} width={40} tick={{ fill: tickColor }} />
            <YAxis yAxisId="lhPdg" orientation="right" fontSize={12} width={40} tick={{ fill: tickColor }} />
            <Tooltip
              labelFormatter={(d) => `Day ${d}`}
              formatter={(value, name) => [value, name]}
              contentStyle={
                dark ? { background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" } : undefined
              }
            />
            <Legend wrapperStyle={{ color: tickColor, fontSize: 11 }} />
            {win.showColdStartLine && (
              <ReferenceLine
                x={coldStartDays}
                yAxisId="lhPdg"
                stroke={dark ? "#38bdf8" : "#0ea5e9"}
                strokeDasharray="3 3"
                label={{ value: "예측 시작", position: "top", fontSize: 10, fill: dark ? "#38bdf8" : "#0ea5e9" }}
              />
            )}

            {/* 실측선을 먼저 그려서 예측선이 위에 오게 한다 */}
            {showActual && actualLine("lhPdg", "lhActual", COLORS.lh, "LH 실측")}
            {showActual && actualLine("estrogen", "estrogenActual", COLORS.estrogen, "Estrogen 실측")}
            {showActual && actualLine("lhPdg", "pdgActual", COLORS.pdg, "PdG 실측")}

            <Line
              yAxisId="lhPdg"
              type="monotone"
              dataKey="lh"
              name="LH 예측"
              stroke={COLORS.lh}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.lh }}
              isAnimationActive={!fastForward}
              connectNulls
            />
            <Line
              yAxisId="estrogen"
              type="monotone"
              dataKey="estrogen"
              name="Estrogen 예측"
              stroke={COLORS.estrogen}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.estrogen }}
              isAnimationActive={!fastForward}
              connectNulls
            />
            <Line
              yAxisId="lhPdg"
              type="monotone"
              dataKey="pdg"
              name="PdG 예측 (불확실)"
              stroke={COLORS.pdg}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.pdg }}
              isAnimationActive={!fastForward}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-neutral-400 dark:text-slate-500">
        {hasActual && (
          <>
            <span className="font-medium">굵은 선이 예측, 흐린 점선이 실측</span>입니다. 실측값은 Mira 기기로
            측정한 mcPHASES 원본 데이터이며, 모델 입력에는 포함되지 않았습니다.
            <br />
          </>
        )}
        PdG(프로게스테론)는 결측치가 많아(약 65%) 점선으로 표시돼요 — 예측 신뢰도가 낮을 수 있어요.
      </p>
    </div>
  );
}
