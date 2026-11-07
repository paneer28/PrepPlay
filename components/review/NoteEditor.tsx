"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

// Coordinates the side note panels on a review page: only one is open at a
// time, a panel with unsaved text asks before another one replaces it, and a
// saved note shows on every card for the same question.

type NoteEditorContext = {
  openId: string | null;
  // Another card asked to open while this one had unsaved text.
  pendingId: string | null;
  request: (id: string) => void;
  close: () => void;
  discardAndOpenPending: () => void;
  keepWriting: () => void;
  setDirty: (id: string, dirty: boolean) => void;
  saved: Record<string, string | null>;
  markSaved: (ref: string, note: string | null) => void;
};

const Context = createContext<NoteEditorContext | null>(null);

export function NoteEditorProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Record<string, string | null>>({});
  const dirty = useRef(new Set<string>());

  const request = useCallback(
    (id: string) => {
      if (openId && openId !== id && dirty.current.has(openId)) {
        setPendingId(id);
        return;
      }
      setPendingId(null);
      setOpenId(id);
    },
    [openId]
  );

  const value = useMemo<NoteEditorContext>(
    () => ({
      openId,
      pendingId,
      request,
      close: () => {
        if (openId) dirty.current.delete(openId);
        setOpenId(null);
        setPendingId(null);
      },
      discardAndOpenPending: () => {
        if (openId) dirty.current.delete(openId);
        setOpenId(pendingId);
        setPendingId(null);
      },
      keepWriting: () => setPendingId(null),
      setDirty: (id, isDirty) => {
        if (isDirty) dirty.current.add(id);
        else dirty.current.delete(id);
      },
      saved,
      markSaved: (ref, note) => setSaved((current) => ({ ...current, [ref]: note }))
    }),
    [openId, pendingId, request, saved]
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useNoteEditor() {
  const context = useContext(Context);
  if (!context) throw new Error("useNoteEditor must be used inside a NoteEditorProvider.");
  return context;
}
