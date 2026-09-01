import type { SalesReport } from "@/types";

/** Flatten a report to shareable / downloadable plain text. */
export function reportToText(r: SalesReport): string {
  const lines: string[] = [];
  const rule = "=".repeat(60);

  lines.push(rule, `SALES INTELLIGENCE REPORT`, rule, "");
  lines.push(r.headline, "", r.summary, "");
  lines.push(`Selling:        ${r.input.product}`);
  lines.push(`Industry:       ${r.input.industry}`);
  lines.push(`Business model: ${r.input.businessModel}`);
  lines.push(`Deal size:      ${r.input.dealSize}`);
  lines.push(`Buyer type:     ${r.input.buyerType}`, "");

  lines.push(rule, "1. OBJECTIONS & 6KLH", rule);
  r.objections.forEach((o, i) => {
    lines.push("", `${i + 1}. "${o.objection}"  [${o.category}]`);
    lines.push(`   Why it comes up: ${o.whyItComesUp}`);
    lines.push(`   Stab:  ${o.stab}`);
    lines.push(`   Twist: ${o.twist}`);
    lines.push(`   6KLH:`);
    o.sixKLH.forEach((k) => lines.push(`     - ${k}`));
    lines.push(`   Recommended response: ${o.recommendedResponse}`);
  });

  lines.push("", rule, "2. CLIENT QUESTIONS", rule);
  r.clientQuestions.forEach((q, i) => {
    lines.push("", `${i + 1}. ${q.question}`);
    lines.push(`   Answer:    ${q.suggestedAnswer}`);
    lines.push(`   Follow-up: ${q.followUp}`);
  });

  lines.push("", rule, "3. INACTION COST CALCULATOR", rule, "");
  lines.push("Assumptions:");
  r.inactionCost.assumptions.forEach((a) => lines.push(`  - ${a}`));
  lines.push("", `Monthly loss: ${r.inactionCost.monthlyLoss}`);
  lines.push(`Yearly loss:  ${r.inactionCost.yearlyLoss}`);
  lines.push("", r.inactionCost.explanation);

  lines.push("", rule, "4. SALES PLAYBOOK & CLOSERS", rule, "");
  lines.push("Discovery questions:");
  r.playbook.discoveryQuestions.forEach((q) => lines.push(`  - ${q}`));
  lines.push("", "Value props:");
  r.playbook.valueProps.forEach((v) => lines.push(`  - ${v}`));
  lines.push("", "Closing lines:");
  r.playbook.closingLines.forEach((c) => lines.push(`  - ${c}`));
  lines.push("", "Objection quick reference:");
  r.playbook.quickReference.forEach((qr) => lines.push(`  - ${qr.objection} => ${qr.oneLiner}`));

  lines.push("", rule, `Generated ${new Date(r.generatedAt).toLocaleString()}`, rule);
  return lines.join("\n");
}

export function reportFilename(r: SalesReport, ext: string): string {
  const slug = r.input.industry
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `sales-report-${slug || "deal"}.${ext}`;
}
