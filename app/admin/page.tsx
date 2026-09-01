"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Lock, Trash2, Upload } from "lucide-react";
import type { Transcript } from "@/types";
import {
  addTranscript,
  checkAdminPassword,
  deleteTranscript,
  getTranscripts,
  hasAdminSession,
  setAdminSession,
} from "@/lib/transcripts";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(hasAdminSession());
    setChecked(true);
  }, []);

  if (!checked) return null;
  return authed ? <AdminPanel onLock={() => { setAdminSession(false); setAuthed(false); }} /> : <Gate onOk={() => setAuthed(true)} />;
}

function Gate({ onOk }: { onOk: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkAdminPassword(pw)) {
      setAdminSession(true);
      onOk();
    } else {
      setError(true);
    }
  };

  return (
    <form onSubmit={submit} className="card mx-auto mt-16 max-w-sm space-y-4 p-6">
      <div className="flex items-center gap-2 text-slate-100">
        <Lock size={18} className="text-teal-accent" />
        <h1 className="text-lg font-bold">Admin access</h1>
      </div>
      <p className="text-sm text-slate-400">Enter the admin password to manage training transcripts.</p>
      <input
        type="password"
        autoFocus
        className="input-field"
        placeholder="Password"
        value={pw}
        onChange={(e) => {
          setPw(e.target.value);
          setError(false);
        }}
      />
      {error && <p className="text-sm text-rose-300">Incorrect password.</p>}
      <button type="submit" className="btn-primary w-full">
        Unlock
      </button>
    </form>
  );
}

function AdminPanel({ onLock }: { onLock: () => void }) {
  const [items, setItems] = useState<Transcript[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => setItems(getTranscripts());
  useEffect(() => {
    refresh();
    const h = () => refresh();
    window.addEventListener("sos:transcripts", h);
    return () => window.removeEventListener("sos:transcripts", h);
  }, []);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    setMsg(null);
    let added = 0;
    for (const file of Array.from(files)) {
      if (!file.name.endsWith(".txt") && file.type !== "text/plain") continue;
      const content = await file.text();
      addTranscript(file.name, content);
      added++;
    }
    setBusy(false);
    setMsg(added ? `Added ${added} transcript${added === 1 ? "" : "s"}.` : "No .txt files found.");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Transcript training</h1>
          <p className="mt-1 text-sm text-slate-400">
            Uploaded transcripts are injected as extra context into every report generation.
          </p>
        </div>
        <button onClick={onLock} className="btn-ghost !px-3 !py-1.5 text-xs">
          Lock admin
        </button>
      </div>

      <label
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        className="card flex cursor-pointer flex-col items-center justify-center gap-2 border-dashed p-10 text-center transition hover:border-teal-accent/40"
      >
        <input
          ref={fileRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        {busy ? (
          <Loader2 className="animate-spin text-teal-accent" />
        ) : (
          <Upload className="text-teal-accent" />
        )}
        <p className="text-sm font-medium text-slate-200">Drop .txt transcript files here or click to browse</p>
        <p className="text-xs text-slate-500">Plain text only</p>
      </label>

      {msg && <p className="text-sm text-teal-accent">{msg}</p>}

      <div className="card">
        <div className="border-b border-white/10 p-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Uploaded transcripts ({items.length})
        </div>
        {items.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No transcripts uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText size={16} className="shrink-0 text-slate-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">{t.name}</p>
                    <p className="text-xs text-slate-500">
                      {(t.size / 1024).toFixed(1)} KB · {new Date(t.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => deleteTranscript(t.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300"
                  aria-label="Delete transcript"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
