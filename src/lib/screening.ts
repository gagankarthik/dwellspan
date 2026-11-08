/**
 * Owner screening questions: a few questions an owner adds to one listing,
 * answered by the renter with their request. The Renter Passport already
 * covers identity, income, rental history, pets, and household, so these are
 * for things specific to the home. Safe to import on the client.
 */

export type QuestionKind = "yesno" | "choice" | "text";
export type ScreeningQuestion = { id: string; text: string; kind: QuestionKind; options?: string[]; required: boolean };
export type ScreeningAnswer = { questionId: string; question: string; answer: string };

export const MAX_QUESTIONS = 6;
export const MAX_OPTIONS = 6;
export const KIND_LABEL: Record<QuestionKind, string> = { yesno: "Yes or no", choice: "Pick one", text: "Short answer" };

/** Questions owners commonly ask that the Passport does not already cover. */
export const SUGGESTED: Omit<ScreeningQuestion, "id">[] = [
  { text: "What is the latest date you could move in?", kind: "text", required: true },
  { text: "How long do you expect to stay?", kind: "choice", options: ["1 to 3 months", "3 to 6 months", "6 to 12 months", "More than 12 months"], required: true },
  { text: "Could you do a video call or viewing before we confirm?", kind: "yesno", required: true },
  { text: "Will you work from home most days?", kind: "yesno", required: false },
  { text: "Do you plan to have guests stay longer than two weeks?", kind: "yesno", required: false },
  { text: "Are you comfortable with quiet hours from 10 pm to 7 am?", kind: "yesno", required: false },
  { text: "Could you sign within 48 hours of approval?", kind: "yesno", required: false },
  { text: "Anything about your move you would like us to know?", kind: "text", required: false },
];

/**
 * Words that usually signal a question about a protected class under the Fair
 * Housing Act and common state and city laws. A hit blocks the question so the
 * owner rewords it. This is a guardrail, not legal advice.
 */
const PROTECTED: [RegExp, string][] = [
  [/\b(race|racial|ethnic\w*|colou?r of)\b/i, "race or color"],
  [/\b(religio\w*|church|mosque|temple|synagogue|christian|muslim|jewish|hindu|pray\w*)\b/i, "religion"],
  [/\b(nationality|national origin|citizen\w*|immigra\w*|visa|green card|where are you from|born in|native language|accent)\b/i, "national origin or citizenship"],
  [/\b(sex|gender|male|female|man or woman|pregnan\w*|sexual\w*|gay|lesbian|transgender|orientation)\b/i, "sex, gender, or orientation"],
  [/\b(child\w*|kids?|bab(y|ies)|famil(y|ies)|married|marital|spouse|husband|wife|partner|boyfriend|girlfriend|single parent)\b/i, "familial or marital status"],
  [/\b(disab\w*|handicap\w*|wheelchair|medical|medication|illness|diagnos\w*|mental|therapy|sobriety|addict\w*)\b/i, "disability"],
  [/\b(how old|your age|\bage\b|birth ?(date|day)|date of birth|retired|senior)\b/i, "age"],
  [/\b(section 8|voucher|housing assistance|welfare|disability benefits|food stamps|snap)\b/i, "source of income"],
];

export function fairHousingIssue(text: string): string | null {
  const hit = PROTECTED.find(([re]) => re.test(text));
  return hit ? `This may ask about ${hit[1]}, which fair housing law protects. Reword it to be about the home, not the person.` : null;
}

const newQid = () => Math.random().toString(36).slice(2, 10);

/** Checks and cleans an owner's question list. */
export function parseQuestions(raw: unknown): { questions: ScreeningQuestion[]; errors: Record<string, string> } {
  const list = Array.isArray(raw) ? raw.slice(0, MAX_QUESTIONS) : [];
  const errors: Record<string, string> = {};
  const questions: ScreeningQuestion[] = [];
  list.forEach((q: Partial<ScreeningQuestion> | null, i) => {
    const text = String(q?.text ?? "").trim().replace(/\s+/g, " ").slice(0, 160);
    if (!text) return;
    const kind: QuestionKind = q?.kind === "yesno" || q?.kind === "choice" ? q.kind : "text";
    const options =
      kind === "choice"
        ? [...new Set((Array.isArray(q?.options) ? q.options : []).map((o) => String(o).trim().slice(0, 60)).filter(Boolean))].slice(0, MAX_OPTIONS)
        : undefined;
    const issue = fairHousingIssue([text, ...(options ?? [])].join(" "));
    if (issue) errors[`q${i}`] = issue;
    else if (kind === "choice" && (options?.length ?? 0) < 2) errors[`q${i}`] = "Give at least two choices.";
    const id = typeof q?.id === "string" && /^[a-z0-9]{4,12}$/.test(q.id) ? q.id : newQid();
    questions.push({ id, text, kind, ...(options ? { options } : {}), required: q?.required !== false });
  });
  return { questions, errors };
}

/** Checks a renter's answers against the listing's questions. */
export function parseAnswers(questions: ScreeningQuestion[], raw: unknown): { answers: ScreeningAnswer[]; errors: Record<string, string> } {
  const given = (raw ?? {}) as Record<string, unknown>;
  const answers: ScreeningAnswer[] = [];
  const errors: Record<string, string> = {};
  for (const q of questions) {
    const a = String(given[q.id] ?? "").trim().slice(0, 500);
    if (!a) {
      if (q.required) errors[q.id] = "Please answer this question.";
      continue;
    }
    if (q.kind === "yesno" && a !== "Yes" && a !== "No") errors[q.id] = "Choose yes or no.";
    else if (q.kind === "choice" && !q.options?.includes(a)) errors[q.id] = "Pick one of the choices.";
    else answers.push({ questionId: q.id, question: q.text, answer: a });
  }
  return { answers, errors };
}
