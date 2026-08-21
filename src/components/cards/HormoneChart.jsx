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
import { COLD_START_DAYS, TOTAL_DAYS } from "../../state/simulationStore";

// data: [{day, date, lh, estrogen, pdg}, ...] — day < COLD_START_DAYS인 항목은 lh/estrogen/pdg가
// null이라, 20일차 이전 구간은 그래프 위에 아무 선도 그려지지 않는 "빈 구간"으로 남는다.
// 이게 의도된 연출이다: 하루씩 넘기다 Day 20에서 점 하나가 처음 찍히고, 이후 오른쪽으로
// 곡선이 자라난다 — "예측 상세 탭에 누적 그래프를 두면 데모 효과가 가장 크다"는 지시서 원칙.
// X축 domain은 currentDay가 아니라 전체 시뮬레이션 길이(1~TOTAL_DAYS)로 고정한다 —
// 매번 축이 다시 스케일링되면 "자라나는" 느낌 대신 그래프가 계속 흔들리는 것처럼 보인다.
export default function HormoneChart({ data, theme = "light", fastForward = false }) {
  const dark = theme === "dark";
  const gridStroke = dark ? "#1e293b" : "#eee";
  const tickColor = dark ? "#94a3b8" : "#666";

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <h3 className="text-sm font-medium opacity-70">호르몬 추정 곡선</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, TOTAL_DAYS]}
              ticks={[1, COLD_START_DAYS, TOTAL_DAYS]}
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
              contentStyle={
                dark ? { background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" } : undefined
              }
            />
            <Legend wrapperStyle={{ color: tickColor }} />
            <ReferenceLine
              x={COLD_START_DAYS}
              yAxisId="lhPdg"
              stroke={dark ? "#38bdf8" : "#0ea5e9"}
              strokeDasharray="3 3"
              label={{ value: "예측 시작", position: "top", fontSize: 10, fill: dark ? "#38bdf8" : "#0ea5e9" }}
            />
            <Line
              yAxisId="lhPdg"
              type="monotone"
              dataKey="lh"
              name="LH"
              stroke={dark ? "#fb923c" : "#fb7cac"}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: dark ? "#fb923c" : "#fb7cac" }}
              isAnimationActive={!fastForward}
              connectNulls
            />
            <Line
              yAxisId="estrogen"
              type="monotone"
              dataKey="estrogen"
              name="Estrogen"
              stroke={dark ? "#34d399" : "#6ee7b7"}
              strokeWidth={2}
              dot={{ r: 2.5, strokeWidth: 0, fill: dark ? "#34d399" : "#6ee7b7" }}
              isAnimationActive={!fastForward}
              connectNulls
            />
            <Line
              yAxisId="lhPdg"
              type="monotone"
              dataKey="pdg"
              name="PdG (불확실)"
              stroke={dark ? "#facc15" : "#c4b5fd"}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={{ r: 2.5, strokeWidth: 0, fill: dark ? "#facc15" : "#c4b5fd" }}
              isAnimationActive={!fastForward}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-[11px] text-neutral-400 dark:text-slate-500">
        PdG(프로게스테론)는 결측치가 많아(약 65%) 점선으로 표시돼요 — 예측 신뢰도가 낮을 수 있어요.
      </p>
    </div>
  );
}
