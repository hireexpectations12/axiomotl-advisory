export type Target = { kind: "question" | "outcome"; id: string };
export type Choice = { id: string; label: string; next?: Target };
export type Question = {
  id: string;
  title: string;
  help?: string;
  required?: boolean;
  kind?: "choice" | "text";
  placeholder?: string;
  choices: Choice[];
  next?: Target;
};
export type Outcome = {
  id: string;
  title: string;
  body: string;
  outputs: string[];
  ctaLabel: string;
  ctaUrl: string;
};
export type FormRule = {
  id: string;
  label: string;
  fromQuestionId: string;
  match: "all" | "any";
  conditions: { questionId: string; answerId: string }[];
  target: Target;
};
export type FormDefinition = {
  id: string;
  name: string;
  startQuestionId: string;
  questions: Question[];
  outcomes: Outcome[];
  rules: FormRule[];
  fallbackOutcomeId: string;
  email: string;
  emailSubject: string;
};
export type Answers = Record<string, string>;
export type FormEvaluation = {
  questionId?: string;
  outcomeId?: string;
  ruleId?: string;
  path: string[];
  trace?: {
    questionId: string;
    answerId: string;
    ruleId?: string;
    target: Target;
  }[];
};
export type SitePage = {
  id: string;
  path: string;
  title: string;
  description: string;
  socialImage: string;
  noIndex: boolean;
  html: string;
  css: string;
  project: Record<string, unknown> | null;
};
export type SiteSettings = {
  name: string;
  email: string;
  favicon: string;
  logo: string;
  font: string;
  background: string;
  foreground: string;
  accent: string;
  customCss: string;
  motion: boolean;
  headingAccent?: string;
  heroAccent?: string;
  business?: {
    phone: string;
    address: string;
    hours: string;
    socialLinks: SiteLink[];
  };
  seo?: { title: string; description: string; socialImage: string };
  announcement?: {
    enabled: boolean;
    text: string;
    url: string;
    expiresAt: string;
  };
  navigation?: SiteLink[];
  footer?: { text: string; links: SiteLink[] };
  contact?: { recipient: string; confirmation: string; showFields: boolean };
};
export type SiteLink = { label: string; url: string };
export type StaffRole = "owner" | "publisher" | "editor";
export type SiteDocument = {
  schemaVersion: 1;
  settings: SiteSettings;
  pages: SitePage[];
  forms: FormDefinition[];
};
export type SiteState = {
  document: SiteDocument;
  version: number;
  publishedAt: string | null;
  role?: StaffRole;
};
export type Revision = {
  id: string;
  created_at: string;
  label: string;
  created_by: string;
  summary?: string;
};
export type MediaAsset = {
  id: string;
  name: string;
  url: string;
  size: number;
  created_at: string;
};
