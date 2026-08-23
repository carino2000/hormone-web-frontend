import { useState } from "react";

// 날짜별 메모(일기)를 localStorage에 저장하는 훅.
// 백엔드가 아직 없으므로(FRONTEND_SPEC 참고) 클라이언트 로컬 저장으로만 동작한다.
const STORAGE_KEY = "hormone-web:calendar-notes:v1";

function readAll() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(notes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // 저장 실패(프라이빗 모드 등)는 조용히 무시 — 메모는 필수 기능이 아님
  }
}

export function useCalendarNotes() {
  const [notes, setNotes] = useState(readAll);

  const saveNote = (dateKey, text) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (text && text.trim()) {
        next[dateKey] = text;
      } else {
        delete next[dateKey];
      }
      writeAll(next);
      return next;
    });
  };

  const deleteNote = (dateKey) => saveNote(dateKey, "");

  return { notes, saveNote, deleteNote };
}
