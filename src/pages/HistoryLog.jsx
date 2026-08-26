import { useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { getHistoryLog, getVitals } from "../api";
import { useSimulationStore } from "../state/simulationStore";
import PCFrame from "../components/devices/PCFrame";
import MobileFrame from "../components/devices/MobileFrame";
import WatchFrame from "../components/devices/WatchFrame";
import { WatchSignals } from "../components/devices/WatchScreens";
import { PHASE_LABELS_KO } from "../lib/phase";

const FRAMES = { pc: PCFrame, mobile: MobileFrame, watch: WatchFrame };

/**
 * 한 페이지에 보여줄 일수.
 *
 * ★ PC 프레임 안쪽 높이(600px - 패딩)에 <b>스크롤 없이</b> 들어가는 값이다.
 *   10개였을 때는 목록이 넘쳐서 프레임 안에 또 스크롤이 생겼는데, 이 탭은
 *   "DB 에 뭐가 쌓였나"를 한눈에 훑는 자리라 스크롤이 생기면 목적을 잃는다.
 *   행 높이나 상단 카드를 건드리면 이 값도 다시 재야 한다.
 */
const PAGE_SIZE = 7;

/**
 * 히스토리 로그 탭.
 *
 * 다른 탭이 "제품이 이렇게 생겼다"라면 이 탭은 **"DB 에 실제로 뭐가 쌓였나"**다.
 * 하루마다 받은 입력(X 44개)과 내놓은 출력(Y = 호르몬 3종 + phase + 다음 월경)을
 * 원본 값 그대로 보여준다.
 *
 * 파이썬 모델을 붙인 뒤 값이 이상할 때 제일 먼저 열어볼 자리다. 그래서 가공하지 않는다 —
 * 요약이나 반올림으로 예쁘게 만들면 디버깅에 못 쓴다.
 *
 * ★ 최신순이다. 로그는 방금 일어난 일이 위에 있어야 한다.
 * ★ Y 가 없는 날이 정상이다 — 콜드스타트 구간(Day 1~19)은 수집만 한다.
 *   그 사실 자체가 로그에서 보여야 해서 행을 숨기지 않는다.
 */
export default function HistoryLog({ device }) {
  const currentDay = useSimulationStore((s) => s.currentDay);
  const dataRevision = useSimulationStore((s) => s.dataRevision);

  const key = `${currentDay}|${dataRevision}`;
  const [loaded, setLoaded] = useState({ key: null, rows: [] });
  const [openDay, setOpenDay] = useState(null);
  // 페이지를 일차와 묶어서 들고 있는다. effect 안에서 setState 하면
  // react-hooks/set-state-in-effect 에 걸리므로, 렌더 시점에 파생한다.
  const [pageState, setPageState] = useState({ day: currentDay, page: 0 });

  useEffect(() => {
    let cancelled = false;
    // vitals 는 워치 화면(신호 타일)에서만 쓴다. PC/모바일 표에는 안 들어간다.
    Promise.all([getHistoryLog(currentDay), getVitals(currentDay)]).then(
      ([rows, vitals]) => {
        if (!cancelled) setLoaded({ key, rows, vitals });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [key, currentDay]);

  // 하루를 넘기면 새 기록이 맨 위에 붙는다. 3페이지를 보고 있었다면 1페이지로 돌아가야
  // 방금 들어온 걸 본다 — 안 그러면 "왜 안 늘지?" 하게 된다.
  const page = pageState.day === currentDay ? pageState.page : 0;
  const setPage = (p) => setPageState({ day: currentDay, page: p });

  const Frame = FRAMES[device];
  const rows = loaded.rows;

  // 워치에 44행 표를 넣을 자리가 없다. 대신 "워치가 실제로 재는 신호" 4개를
  // 타일로 보여준다 — 기록 탭의 성격(원본 값)을 워치 크기로 옮긴 것이다.
  if (device === "watch") {
    return (
      <Frame>
        <WatchSignals vitals={loaded.vitals} />
      </Frame>
    );
  }

  if (rows.length === 0) {
    return (
      <Frame>
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm opacity-60 dark:border-white/5 dark:bg-slate-900">
          <p>아직 저장된 기록이 없습니다.</p>
          <p className="mt-1 text-xs">시뮬레이터에서 &quot;하루 넘기기&quot;를 눌러 시작하세요.</p>
        </div>
      </Frame>
    );
  }

  const predicted = rows.filter((r) => r.hasPrediction).length;
  const failed = rows.filter((r) => r.job?.status === "FAILED").length;

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const start = safePage * PAGE_SIZE;
  const pageRows = rows.slice(start, start + PAGE_SIZE);

  return (
    <Frame>
      <div className="@container flex flex-col gap-4">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-slate-900">
          <h3 className="text-sm font-medium opacity-70">히스토리 로그</h3>
          <p className="mt-2 text-sm">
            <span className="text-2xl font-semibold tabular-nums">{rows.length}</span>
            <span className="ml-1.5 text-xs opacity-60">일치 저장됨</span>
          </p>
          <p className="mt-1 text-[11px] opacity-60">
            입력(X) 있는 날 <span className="tabular-nums">{rows.length}</span>개 · 출력(Y) 있는 날{" "}
            <span className="tabular-nums">{predicted}</span>개
            {failed > 0 && (
              <span className="text-rose-500">
                {" "}
                · 실패 <span className="tabular-nums">{failed}</span>건
              </span>
            )}
          </p>
          <p className="mt-3 text-[11px] leading-relaxed text-neutral-500 dark:text-slate-400">
            하루마다 <span className="font-medium">받은 입력 44개(X)</span>와{" "}
            <span className="font-medium">내놓은 출력(Y)</span>을 그대로 보여줍니다. 날짜를 누르면
            펼쳐집니다.{" "}
            <span className="text-teal-600 dark:text-teal-300">수집 기록</span>으로 표시된 날은
            예측 시작 전이라 입력만 쌓은 날이고, 입력은 똑같이 다 저장돼 있습니다.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/5 dark:bg-slate-900">
          {pageRows.map((row) => (
            <LogRow
              key={row.day}
              row={row}
              open={openDay === row.day}
              onToggle={() => setOpenDay(openDay === row.day ? null : row.day)}
            />
          ))}

          {pageCount > 1 && (
            <Pager
              page={safePage}
              pageCount={pageCount}
              from={start + 1}
              to={start + pageRows.length}
              total={rows.length}
              onChange={(p) => {
                setPage(p);
                setOpenDay(null); // 페이지가 바뀌면 펼쳐둔 행은 화면에 없다
              }}
            />
          )}
        </div>
      </div>
    </Frame>
  );
}

/**
 * 페이지 이동 바.
 *
 * 83일을 한 번에 깔면 스크롤이 끝없고, 하루 넘길 때마다 DOM 이 83행씩 다시 그려진다.
 * 로그에서 실제로 보는 건 대개 최근 며칠이라 한 페이지 {@link PAGE_SIZE}개면 충분하다.
 */
function Pager({ page, pageCount, from, to, total, onChange }) {
  // 페이지가 많아도 버튼은 최대 5개만. 현재 페이지를 가운데 두고 창을 민다.
  const windowSize = Math.min(5, pageCount);
  let first = Math.max(0, page - Math.floor(windowSize / 2));
  first = Math.min(first, pageCount - windowSize);
  const pages = Array.from({ length: windowSize }, (_, i) => first + i);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-black/5 px-4 py-2.5 dark:border-white/5">
      <span className="text-[11px] tabular-nums opacity-45">
        {from}–{to} / {total}일
      </span>

      <div className="flex items-center gap-1">
        <PagerButton disabled={page === 0} onClick={() => onChange(page - 1)} label="이전 페이지">
          <ChevronLeft className="size-3.5" />
        </PagerButton>

        {first > 0 && <span className="px-1 text-[11px] opacity-30">…</span>}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`min-w-7 rounded-md px-2 py-1 text-[11px] tabular-nums transition-colors ${
              p === page
                ? "bg-indigo-500 font-semibold text-white dark:bg-sky-500"
                : "opacity-55 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
            }`}
          >
            {p + 1}
          </button>
        ))}

        {first + windowSize < pageCount && <span className="px-1 text-[11px] opacity-30">…</span>}

        <PagerButton
          disabled={page >= pageCount - 1}
          onClick={() => onChange(page + 1)}
          label="다음 페이지"
        >
          <ChevronRight className="size-3.5" />
        </PagerButton>
      </div>
    </div>
  );
}

function PagerButton({ disabled, onClick, label, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="rounded-md p-1 transition-colors disabled:opacity-20 enabled:hover:bg-black/5 dark:enabled:hover:bg-white/10"
    >
      {children}
    </button>
  );
}

function LogRow({ row, open, onToggle }) {
  const Chevron = open ? ChevronDown : ChevronRight;

  return (
    <div className="border-b border-black/5 last:border-b-0 dark:border-white/5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
      >
        <Chevron className="size-3.5 shrink-0 opacity-40" />

        <span className="w-14 shrink-0 text-xs font-semibold tabular-nums">Day {row.day}</span>
        <span className="hidden w-24 shrink-0 text-[11px] tabular-nums opacity-50 @md:inline">
          {row.date}
        </span>

        {/* X: 몇 개 받았나 */}
        <span className="shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-white/10">
          X {row.xMeasured}/{row.xTotal}
        </span>

        {/* Y: 무엇을 내놨나. job 이 실패했으면 예측 결과가 없으므로 그쪽을 먼저 본다. */}
        {row.job?.status === "FAILED" ? (
          <span className="shrink-0 rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-medium text-rose-500 dark:bg-rose-400/10 dark:text-rose-300">
            요청 실패
          </span>
        ) : row.hasPrediction ? (
          <>
            <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-500 dark:bg-sky-400/10 dark:text-sky-300">
              Y 예측됨
            </span>
            <span className="truncate text-[11px] opacity-70">
              {PHASE_LABELS_KO[row.phasePredicted] ?? row.phasePredicted}
              {row.phaseActual && (
                <span className={row.phaseMatched ? "opacity-50" : "ml-1 font-semibold text-rose-500"}>
                  {" "}
                  (실측 {PHASE_LABELS_KO[row.phaseActual] ?? row.phaseActual})
                </span>
              )}
            </span>
          </>
        ) : (
          /* 콜드스타트 구간. 예측은 없지만 웨어러블은 들어와 있다.
             ★ 예측 줄(indigo)·실패 줄(rose)과 색을 갈라 놓는다 — 같은 색을 쓰면
               "예측이 있는 날"로 오해한다. teal 은 이 화면에서 여기서만 쓴다.
             ★ 문구도 "없음"이 아니라 "기록"이다. 데이터가 없는 게 아니라
               아직 예측을 안 돌리는 구간일 뿐이라는 걸 드러낸다. */
          <>
            <span className="shrink-0 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600 dark:bg-teal-400/10 dark:text-teal-300">
              수집 기록
            </span>
            <span className="truncate text-[11px] tabular-nums opacity-55">
              {row.xSummary?.length
                ? row.xSummary
                    .map((s) => `${s.label} ${s.value}${s.unit ? ` ${s.unit}` : ""}`)
                    .join(" · ")
                : "측정된 신호 없음"}
            </span>
          </>
        )}

        <span className="ml-auto flex shrink-0 items-center gap-2 text-[10px] tabular-nums opacity-35">
          {/* 모델 지연은 파이썬을 붙이면 여기가 실제 응답 시간이다 */}
          {row.job?.latencyMs != null && (
            <span className="hidden @lg:inline">{row.job.latencyMs}ms</span>
          )}
          <span className="hidden @lg:inline">{row.modelVersion ?? "—"}</span>
        </span>
      </button>

      {open && <LogDetail row={row} />}
    </div>
  );
}

function LogDetail({ row }) {
  return (
    <div className="bg-neutral-50/60 px-4 pb-5 pt-1 dark:bg-white/[0.02]">
      {/* ---------- Y ---------- */}
      <Section title="Y — 내놓은 출력">
        {row.hasPrediction ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-[11px]">
                <thead>
                  <tr className="text-left opacity-45">
                    <th className="py-1 pr-3 font-medium">항목</th>
                    <th className="py-1 pr-3 text-right font-medium">예측</th>
                    <th className="py-1 pr-3 text-right font-medium">실측</th>
                    <th className="py-1 text-right font-medium">오차</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {row.hormones.map((h) => (
                    <tr key={h.key} className="border-t border-black/5 dark:border-white/5">
                      <td className="py-1 pr-3">
                        {h.label}
                        <span className="ml-1 opacity-40">{h.unit}</span>
                      </td>
                      <td className="py-1 pr-3 text-right font-medium">{fmt(h.predicted)}</td>
                      <td className="py-1 pr-3 text-right opacity-60">{fmt(h.actual)}</td>
                      <td
                        className={`py-1 text-right ${
                          h.errorPct == null
                            ? "opacity-30"
                            : Math.abs(h.errorPct) > 20
                              ? "text-rose-500"
                              : "opacity-60"
                        }`}
                      >
                        {h.errorPct == null ? "—" : `${h.errorPct > 0 ? "+" : ""}${h.errorPct.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t border-black/5 dark:border-white/5">
                    <td className="py-1 pr-3">주기 단계</td>
                    <td className="py-1 pr-3 text-right font-medium">
                      {PHASE_LABELS_KO[row.phasePredicted] ?? row.phasePredicted ?? "—"}
                    </td>
                    <td className="py-1 pr-3 text-right opacity-60">
                      {PHASE_LABELS_KO[row.phaseActual] ?? row.phaseActual ?? "—"}
                    </td>
                    <td
                      className={`py-1 text-right ${
                        row.phaseMatched == null
                          ? "opacity-30"
                          : row.phaseMatched
                            ? "opacity-60"
                            : "font-semibold text-rose-500"
                      }`}
                    >
                      {row.phaseMatched == null ? "—" : row.phaseMatched ? "일치" : "불일치"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] opacity-50">
              <span>모델 {row.modelVersion ?? "—"}</span>
              {row.confidence != null && <span>확신도 {Math.round(row.confidence * 100)}%</span>}
            </div>
          </>
        ) : row.job?.status === "FAILED" ? (
          // ★ "예측 시작 전"과 "요청이 실패함"은 완전히 다른 상황이다.
          //   둘 다 Y 가 없다고 같은 문구를 쓰면 진단이 반대로 간다.
          <p className="text-[11px] text-rose-500">
            예측 요청이 실패해서 이 날은 출력이 없습니다. 아래 <strong>요청</strong> 섹션에 사유가 있습니다.
          </p>
        ) : row.job?.status === "PENDING" ? (
          <p className="text-[11px] text-amber-500">아직 계산 중입니다.</p>
        ) : (
          <p className="text-[11px] opacity-45">
            예측 시작 전이라 이 날은 수집만 했습니다. 입력은 아래에 그대로 저장돼 있습니다.
          </p>
        )}
      </Section>

      {/* ---------- 요청(job) ---------- */}
      {row.job && (
        <Section title="요청 — 모델에 무엇을 보냈나">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <Field label="상태">
              <span
                className={
                  row.job.status === "FAILED"
                    ? "font-semibold text-rose-500"
                    : row.job.status === "PENDING"
                      ? "text-amber-500"
                      : ""
                }
              >
                {JOB_STATUS_KO[row.job.status] ?? row.job.status}
              </span>
            </Field>
            {row.job.latencyMs != null && <Field label="소요">{row.job.latencyMs}ms</Field>}
            {row.job.sentDay != null && (
              <Field label="보낸 일차">
                {/* 백엔드 Day 와 다르면 day-offset 보정이 걸린 것이다. 다르다고 오류는 아니다 */}
                <span className={row.job.sentDay === row.day ? "" : "text-amber-500"}>
                  day={row.job.sentDay}
                </span>
              </Field>
            )}
          </div>

          {row.job.errorMessage && (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-rose-50 p-2 font-mono text-[10px] text-rose-600 dark:bg-rose-400/10 dark:text-rose-300">
              {row.job.errorMessage}
            </pre>
          )}

          {row.job.responsePreview ? (
            <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-black/[0.03] p-2 font-mono text-[10px] opacity-70 dark:bg-white/5">
              {row.job.responsePreview}
            </pre>
          ) : row.job.status === "FAILED" ? (
            <p className="mt-2 text-[10px] opacity-35">
              응답 원문 없음 — 서버에 닿지 못했거나 응답 전에 끊겼습니다.
            </p>
          ) : (
            <p className="mt-2 text-[10px] opacity-35">
              응답 원문이 기록되지 않았습니다.
            </p>
          )}
        </Section>
      )}

      {/* ---------- X ---------- */}
      <Section title={`X — 받은 입력 ${row.xMeasured}/${row.xTotal}`}>
        <div className="flex flex-col gap-3">
          {row.xGroups.map((g) => (
            <div key={g.name}>
              <p className="text-[10px] font-medium opacity-40">
                {g.name}
                <span className="ml-1 tabular-nums opacity-70">{g.items.length}</span>
              </p>
              {/* 열을 넉넉히 준다. 여기 왼쪽에 찍히는 건 한글 라벨이 아니라 DB 컬럼명이고,
                  제일 긴 게 temperature_diff_from_baseline(30자)라 좁으면 잘린다.
                  잘린 컬럼명은 파이썬 쪽과 대조할 때 쓸모가 없으므로 열 수보다 폭이 우선이다. */}
              <div className="mt-1 grid grid-cols-1 gap-x-4 gap-y-0.5 @md:grid-cols-2 @2xl:grid-cols-3">
                {g.items.map((it) => (
                  <div
                    key={it.key}
                    className="flex items-baseline justify-between gap-2 border-b border-black/[0.04] py-0.5 dark:border-white/[0.04]"
                  >
                    {/* 컬럼명을 그대로 노출한다 — 파이썬 쪽과 대조할 때 한글 라벨로는 못 찾는다 */}
                    <span
                      className={`truncate font-mono text-[10px] ${it.measured ? "opacity-50" : "opacity-25"}`}
                      title={`${it.label} (${it.key})`}
                    >
                      {it.key}
                    </span>
                    <span
                      className={`shrink-0 text-[11px] tabular-nums ${
                        it.measured ? "font-medium" : "opacity-25"
                      }`}
                    >
                      {it.measured ? it.value.toFixed(it.decimals) : "null"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

const JOB_STATUS_KO = {
  PENDING: "요청 중",
  SUCCEEDED: "성공",
  FAILED: "실패",
};

function Field({ label, children }) {
  return (
    <span className="tabular-nums">
      <span className="opacity-40">{label}</span> {children}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="mt-4 first:mt-2">
      <p className="mb-1.5 text-[11px] font-semibold opacity-60">{title}</p>
      {children}
    </div>
  );
}

function fmt(v) {
  return v == null ? "—" : Number(v).toFixed(1);
}
