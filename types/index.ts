// ---------------------------------------------------------------------------
// Shared types for the Sales Objection Subscription app
// ---------------------------------------------------------------------------

export type PlanId = "free" | "trial" | "monthly" | "lifetime";

export interface PlanConfig {
  id: PlanId;
  name: string;
  /** Monthly token quota. `null` means unlimited. */
  tokens: number | null;
  /** Price in INR. 0 for free plans. */
  price: number;
  priceLabel: string;
  /** For the trial only — how long full access lasts. */
  durationDays?: number;
  badgeClass: string;
  tagline: string;
  perks: string[];
  features: {
    pdf: boolean;
    share: boolean;
  };
}

export interface User {
  email: string;
  /** Plaintext — localStorage only, assignment scope. Never do this in production. */
  password: string;
  name?: string;
  createdAt: string;
}

export interface Subscription {
  plan: PlanId;
  /** Remaining tokens in the current period. Ignored for `lifetime`. */
  tokensRemaining: number;
  /** ISO timestamp marking the start of the current monthly period. */
  periodStart: string;
  /** ISO timestamp — set when the trial is activated. */
  trialEndsAt?: string;
  /** ISO timestamp — set when a paid plan is purchased. */
  purchasedAt?: string;
}

export interface UsageRecord {
  id: string;
  createdAt: string;
  title: string;
  tokensUsed: number;
  plan: PlanId;
}

export interface Transcript {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
  size: number;
}

export interface SalesInput {
  product: string;
  industry: string;
  businessModel: string;
  dealSize: string;
  buyerType: string;
}

export interface ObjectionItem {
  objection: string;
  category: string;
  whyItComesUp: string;
  stab: string;
  twist: string;
  sixKLH: string[];
  recommendedResponse: string;
}

export interface ClientQuestionItem {
  question: string;
  suggestedAnswer: string;
  followUp: string;
}

export interface InactionCost {
  assumptions: string[];
  monthlyLoss: string;
  yearlyLoss: string;
  explanation: string;
}

export interface Playbook {
  discoveryQuestions: string[];
  valueProps: string[];
  closingLines: string[];
  quickReference: { objection: string; oneLiner: string }[];
}

export interface SalesReport {
  headline: string;
  summary: string;
  objections: ObjectionItem[];
  clientQuestions: ClientQuestionItem[];
  inactionCost: InactionCost;
  playbook: Playbook;
  generatedAt: string;
  input: SalesInput;
}

export interface PaymentDetails {
  cardNumber: string;
  expiry: string;
  cvv: string;
  name: string;
}
