import { useState } from "react";
import { Check, NotebookPen, Trash2, X } from "lucide-react";
import { PHASE_LABELS_KO } from "../../lib/phase";

const DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(dateKey) {
  const [, m, d] = dateKey.split("-").map(Number);
  const date = new Date(dateKey);
  return `${m}월 ${d}일 (${DOW_KO[date.getDay()]})`;
}

// variant "panel": PC 사이드 패널(카드형, 고정 높이 스트레치).
// variant "sheet": 모바일 바텀시트 안에서 쓰는 형태(바깥 카드 없이 내용만).
export default function DiaryPanel({ dateKey, phase, note, onSave, onDelete, onClose, variant = "panel" }) {
  const [draft, setDraft] = useState(note);
  const [justSaved, setJustSaved] = useState(false);

  // 선택된 날짜(또는 그 날짜의 저장된 메모)가 바뀌면 렌더링 중 draft를 다시 맞춘다.
  // (useEffect+setState는 리렌더를 한 번 더 유발하므로 React가 권장하는 방식대로 렌더 중 조정)
  const syncKey = `${dateKey ?? ""}:${note}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setDraft(note);
    setJustSaved(false);
  }

  if (!dateKey) {
    return (
      <div className="animate-fade-in flex h-full min-h-[160px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 p-8 text-center text-xs text-neutral-400 dark:border-slate-700 dark:bg-white/5 dark:text-slate-500">
        <NotebookPen className="h-6 w-6 text-rose-300 dark:text-slate-600" />
        <p>
          날짜를 선택하면
          <br />
          그날의 메모를 남길 수 있어요
        </p>
      </div>
    );
  }

  const handleSave = () => {
    onSave(dateKey, draft);
    setJustSaved(true);
  };

  const isSheet = variant === "sheet";

  return (
    <div
      className={
        isSheet
          ? "flex flex-col"
          : "animate-fade-in flex h-full flex-col rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 via-pink-50 to-violet-50 p-4 dark:border-white/10 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-800 dark:text-slate-100">{formatDateLabel(dateKey)}</p>
          {phase && (
            <p className="mt-0.5 text-xs font-medium text-rose-400 dark:text-amber-400">{PHASE_LABELS_KO[phase]}</p>
          )}
        </div>
        <div className="-mr-1 -mt-1 flex items-center gap-1">
          {note && (
            <button
              type="button"
              onClick={() => onDelete(dateKey)}
              aria-label="메모 삭제"
              className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/70 hover:text-rose-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-amber-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="닫기"
              className="rounded-full p-1.5 text-neutral-400 transition hover:bg-white/70 hover:text-rose-400 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-amber-400"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setJustSaved(false);
        }}
        placeholder="오늘 컨디션이나 증상을 기록해보세요..."
        rows={isSheet ? 3 : 5}
        maxLength={300}
        className={[
          "mt-3 w-full flex-1 resize-none rounded-xl border p-3 text-sm leading-relaxed text-neutral-700 dark:text-slate-100",
          "placeholder:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300",
          "dark:placeholder:text-slate-600 dark:focus:ring-amber-500/20 dark:focus:border-amber-500/50",
          isSheet ? "border-rose-100 bg-rose-50/60 dark:border-white/10 dark:bg-white/5" : "border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5",
        ].join(" ")}
      />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-neutral-400 dark:text-slate-500">{draft.length}/300</span>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1 rounded-full bg-rose-400 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-rose-200 transition hover:bg-rose-500 dark:bg-amber-500 dark:text-slate-950 dark:shadow-amber-500/20 dark:hover:bg-amber-400"
        >
          <Check className="h-3.5 w-3.5" />
          {justSaved ? "저장됨" : "저장"}
        </button>
      </div>
    </div>
  );
}
