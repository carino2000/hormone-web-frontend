import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function HormoneChart({ data, theme = "light" }) {
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
            <XAxis dataKey="day" fontSize={12} tick={{ fill: tickColor }} />
            {/* estrogen(0~640)이 lh(0~186)·pdg(1~30)보다 값 범위가 훨씬 커서 축을 공유하면
                LH 서지처럼 중요한 변화가 눌려서 안 보인다 — 보조 축으로 분리 */}
            <YAxis yAxisId="estrogen" fontSize={12} width={40} tick={{ fill: tickColor }} />
            <YAxis yAxisId="lhPdg" orientation="right" fontSize={12} width={40} tick={{ fill: tickColor }} />
            <Tooltip
              contentStyle={
                dark ? { background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" } : undefined
              }
            />
            <Legend wrapperStyle={{ color: tickColor }} />
            <Line
              yAxisId="lhPdg"
              type="monotone"
              dataKey="lh"
              name="LH"
              stroke={dark ? "#fb923c" : "#fb7cac"}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="estrogen"
              type="monotone"
              dataKey="estrogen"
              name="Estrogen"
              stroke={dark ? "#34d399" : "#6ee7b7"}
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="lhPdg"
              type="monotone"
              dataKey="pdg"
              name="PdG (불확실)"
              stroke={dark ? "#facc15" : "#c4b5fd"}
              strokeWidth={2}
              strokeDasharray="4 3"
              dot={false}
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
