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

/**
 * 웨어러블 신호 곡선 (P-02).
 *
 * "왜 웨어러블로 호르몬을 알 수 있는가"를 눈으로 보여주는 차트다.
 * 기여도 막대("HRV 42%")는 숫자라서 와닿지 않는다. 실제 신호가 배란기에 어떻게
 * 움직이는지를 호르몬 곡선과 같은 X축으로 보여주면 대응이 한눈에 보인다.
 *
 * ★ HormoneChart와 X축 domain·ticks가 정확히 같아야 한다. 두 차트를 세로로 붙였을 때
 *   눈금이 어긋나면 "LH 서지 시점에 HRV가 떨어진다"는 대응을 읽을 수 없다.
 *
 * ★ 표시 신호를 HRV와 "수면중" 안정시 심박 둘로 제한한 이유:
 *   이 참가자 90일을 truth.phase 라벨로 묶어 평균 낸 실측이 아래와 같다.
 *                              난포기   가임기   황체기   월경기
 *     rmssd (HRV)               53.5    47.1    47.4    52.1   ← 가임기 12% 하락
 *     sleep_resting_heart_rate  69.3    70.9    73.8    71.3   ← 황체기까지 상승
 *     resting_heart_rate(일간)  74.1    73.9    72.0    71.2   ← 주기 패턴 없음
 *     restlessness               0.08    0.08    0.10    0.09
 *     stress_score              78.3    76.4    74.5    73.4
 *
 *   ★★ 일간 안정시 심박(resting_heart_rate)이 아니라 수면중 값을 쓴다.
 *   예전에는 일간 컬럼을 그렸고 "70.3 → 78.7 로 오른다"고 써 뒀는데, 그건
 *   시드 컬럼명 버그로 일간 자리에 수면중 값이 들어가 있던 시기의 숫자다.
 *   버그를 고치고 나니 일간 값에는 주기 패턴이 사실상 없다(신호강도 0.01).
 *   신호가 있던 건 처음부터 수면중 값(0.79)이었다.
 *
 *   야간 피부온도와 수면 점수는 여기 안 넣는다 — 패턴이 약해서 근거로 내세우면
 *   데이터가 뒷받침하지 않는다. 모델이 44개를 다 먹는다는 사실은 옆의
 *   ModelInputPanel 이 따로 보여준다.
 */
export default function WearableSignalChart({ data, theme = "light", fastForward = false }) {
  const totalDays = useSimulationStore((s) => s.totalDays);
  const coldStartDays = useSimulationStore((s) => s.coldStartDays);
  const dark = theme === "dark";
  const gridStroke = dark ? "#1e293b" : "#eee";
  const tickColor = dark ? "#94a3b8" : "#666";

  const hrvColor = dark ? "#22d3ee" : "#0891b2";
  const rhrColor = dark ? "#f472b6" : "#db2777";

  const hasData = data.some((d) => d.rmssd != null || d.restingHeartRate != null);
  if (!hasData) return null;

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
      <h3 className="text-sm font-medium opacity-70">웨어러블 신호 — 예측의 원재료</h3>

      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="day"
              type="number"
              domain={[1, totalDays]}
              ticks={[1, coldStartDays, Math.round(totalDays / 2), totalDays]}
              tickFormatter={(d) => `D${d}`}
              fontSize={12}
              tick={{ fill: tickColor }}
            />
            <YAxis yAxisId="hrv" fontSize={12} width={40} tick={{ fill: tickColor }} />
            <YAxis yAxisId="rhr" orientation="right" fontSize={12} width={40} tick={{ fill: tickColor }} />
            <Tooltip
              labelFormatter={(d) => `Day ${d}`}
              contentStyle={
                dark ? { background: "#0f172a", border: "1px solid #334155", color: "#e2e8f0" } : undefined
              }
            />
            <Legend wrapperStyle={{ color: tickColor, fontSize: 11 }} />
            <ReferenceLine
              x={coldStartDays}
              yAxisId="hrv"
              stroke={dark ? "#38bdf8" : "#0ea5e9"}
              strokeDasharray="3 3"
            />
            <Line
              yAxisId="hrv"
              type="monotone"
              dataKey="rmssd"
              name="HRV (rmssd)"
              stroke={hrvColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={!fastForward}
              connectNulls
            />
            <Line
              yAxisId="rhr"
              type="monotone"
              dataKey="restingHeartRate"
              name="안정시 심박 (수면중)"
              stroke={rhrColor}
              strokeWidth={2}
              dot={false}
              isAnimationActive={!fastForward}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-neutral-500 dark:text-slate-400">
        위 호르몬 곡선과 <span className="font-medium">같은 날짜 축</span>입니다.{" "}
        <span className="font-medium">가임기에 HRV가 떨어지고, 수면중 안정시 심박은 황체기까지
        올라갑니다</span> — 이 참가자 90일 실측 평균으로 HRV는 난포기 53.5에서 가임기 47.1로 약 12%
        낮아지고, 수면중 심박은 69.3에서 황체기 73.8로 올라갑니다. 모델은 이런 패턴을 학습합니다.
      </p>
    </div>
  );
}
