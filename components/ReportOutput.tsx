"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClipboardList,
  Calculator,
  Download,
  FileText,
  Mail,
  MessageCircle,
  MessagesSquare,
  RotateCcw,
  ShieldQuestion,
} from "lucide-react";
import type { SalesReport } from "@/types";
import { useSession } from "@/components/SessionProvider";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { reportFilename, reportToText } from "@/lib/reportFormat";

type TabId = "objections" | "questions" | "inaction" | "playbook";

const TABS: { id: TabId; label: string; icon: typeof ClipboardList }[] = [
  { id: "objections", label: "Objections & 6KLH", icon: MessagesSquare },
  { id: "questions", label: "Client Questions", icon: ShieldQuestion },
  { id: "inaction", label: "Inaction Cost Calculator", icon: Calculator },
  { id: "playbook", label: "Sales Playbook & Closers", icon: ClipboardList },
];

export function ReportOutput({ report }: { report: SalesReport }) {
  const router = useRouter();
  const { canDownloadPdf, canShare } = useSession();
  const [tab, setTab] = useState<TabId>("objections");

  const text = () => reportToText(report);

  const downloadText = () => {
    const blob = new Blob([text()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = reportFilename(report, "txt");
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<pre style="font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap;padding:32px;">${text()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
    );
    w.document.title = reportFilename(report, "pdf");
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  };

  const shareWhatsApp = () => {
    const msg = `${report.headline}\n\n${report.summary}\n\n(Full Sales Intelligence Report generated with SalesEdge)`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const shareEmail = () => {
    const body = text().slice(0, 1800) + "\n\n... (full report attached separately)";
    window.location.href = `mailto:?subject=${encodeURIComponent(
      "Sales Intelligence Report: " + report.input.industry,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="space-y-5">
      <header className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-100 sm:text-2xl">{report.headline}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{report.summary}</p>
          </div>
          <button onClick={() => router.push("/")} className="btn-ghost !px-3 !py-1.5 text-xs">
            <RotateCcw size={14} /> New analysis
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          <span><span className="text-slate-400">Selling:</span> {report.input.product}</span>
          <span><span className="text-slate-400">Industry:</span> {report.input.industry}</span>
          <span><span className="text-slate-400">Deal size:</span> {report.input.dealSize}</span>
          <span><span className="text-slate-400">Buyer:</span> {report.input.buyerType}</span>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          {canDownloadPdf || canShare ? (
            <div className="flex flex-wrap gap-2">
              {canDownloadPdf && (
                <>
                  <button onClick={downloadPdf} className="btn-ghost !px-3 !py-1.5 text-xs">
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={downloadText} className="btn-ghost !px-3 !py-1.5 text-xs">
                    <FileText size={14} /> Download Text
                  </button>
                </>
              )}
              {canShare && (
                <>
                  <button onClick={shareWhatsApp} className="btn-ghost !px-3 !py-1.5 text-xs">
                    <MessageCircle size={14} /> Share WhatsApp
                  </button>
                  <button onClick={shareEmail} className="btn-ghost !px-3 !py-1.5 text-xs">
                    <Mail size={14} /> Share Email
                  </button>
                </>
              )}
            </div>
          ) : (
            <UpgradePrompt
              title="Downloads & sharing are locked on Always Free"
              message="Start the 30-day trial or upgrade to export this report as PDF / text and share it."
            />
          )}
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="flex gap-1 overflow-x-auto border-b border-white/10 p-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`tab-btn flex items-center gap-1.5 ${tab === t.id ? "tab-btn-active" : ""}`}
              >
                <Icon size={14} /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-5 sm:p-6">
          {tab === "objections" && <ObjectionsTab report={report} />}
          {tab === "questions" && <QuestionsTab report={report} />}
          {tab === "inaction" && <InactionTab report={report} />}
          {tab === "playbook" && <PlaybookTab report={report} />}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{children}</h3>;
}

function ObjectionsTab({ report }: { report: SalesReport }) {
  return (
    <div className="space-y-4">
      {report.objections.map((o, i) => (
        <article key={i} className="rounded-lg border border-white/10 bg-navy-950/40 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-slate-100">&ldquo;{o.objection}&rdquo;</p>
            <span className="shrink-0 rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400">
              {o.category}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{o.whyItComesUp}</p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-rose-400/20 bg-rose-500/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-300">Stab</p>
              <p className="mt-1 text-sm text-slate-300">{o.stab}</p>
            </div>
            <div className="rounded-md border border-teal-accent/20 bg-teal-accent/5 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-accent">Twist</p>
              <p className="mt-1 text-sm text-slate-300">{o.twist}</p>
            </div>
          </div>

          <div className="mt-3">
            <SectionTitle>6KLH lines</SectionTitle>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {o.sixKLH.map((k, j) => (
                <li key={j} className="flex gap-2 text-sm text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-accent" />
                  {k}
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-3 rounded-md bg-white/5 p-3 text-sm text-slate-200">
            <span className="font-semibold text-teal-accent">Say this: </span>
            {o.recommendedResponse}
          </p>
        </article>
      ))}
    </div>
  );
}

function QuestionsTab({ report }: { report: SalesReport }) {
  return (
    <div className="space-y-3">
      {report.clientQuestions.map((q, i) => (
        <article key={i} className="rounded-lg border border-white/10 bg-navy-950/40 p-4">
          <p className="font-semibold text-slate-100">{q.question}</p>
          <p className="mt-2 text-sm text-slate-300">
            <span className="font-semibold text-teal-accent">Answer: </span>
            {q.suggestedAnswer}
          </p>
          <p className="mt-1.5 text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Follow-up: </span>
            {q.followUp}
          </p>
        </article>
      ))}
    </div>
  );
}

function InactionTab({ report }: { report: SalesReport }) {
  const ic = report.inactionCost;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-navy-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Cost of doing nothing / month</p>
          <p className="mt-1 text-2xl font-bold text-rose-300">{ic.monthlyLoss}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-navy-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">…over 12 months</p>
          <p className="mt-1 text-2xl font-bold text-rose-300">{ic.yearlyLoss}</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-navy-950/40 p-4">
        <SectionTitle>Assumptions</SectionTitle>
        <ul className="space-y-1.5">
          {ic.assumptions.map((a, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
              {a}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm leading-relaxed text-slate-300">{ic.explanation}</p>
    </div>
  );
}

function PlaybookTab({ report }: { report: SalesReport }) {
  const p = report.playbook;
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle>Discovery questions</SectionTitle>
        <ol className="space-y-1.5">
          {p.discoveryQuestions.map((q, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-300">
              <span className="font-semibold text-teal-accent">{i + 1}.</span>
              {q}
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <SectionTitle>Value props</SectionTitle>
          <ul className="space-y-1.5">
            {p.valueProps.map((v, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-accent" />
                {v}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionTitle>Closing lines</SectionTitle>
          <ul className="space-y-1.5">
            {p.closingLines.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <SectionTitle>Objection quick reference</SectionTitle>
        <div className="divide-y divide-white/10 rounded-lg border border-white/10">
          {p.quickReference.map((qr, i) => (
            <div key={i} className="grid gap-1 p-3 sm:grid-cols-[1fr_2fr] sm:gap-4">
              <p className="text-sm font-medium text-slate-200">{qr.objection}</p>
              <p className="text-sm text-slate-400">{qr.oneLiner}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
