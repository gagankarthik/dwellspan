"use client";

import { useState } from "react";
import { KIND_LABEL, MAX_QUESTIONS, SUGGESTED, fairHousingIssue, type QuestionKind, type ScreeningQuestion } from "@/lib/screening";
import { Dialog } from "../Dialog";
import { PlusIcon } from "../icons";
import { Select } from "../Select";
import { fieldCls } from "../dashboard-ui";
import { send } from "./useOwnerData";

type Draft = Omit<ScreeningQuestion, "options"> & { options: string };

const toDraft = (q: ScreeningQuestion): Draft => ({ ...q, options: (q.options ?? []).join(", ") });
const fromDraft = (d: Draft): ScreeningQuestion => ({
  id: d.id,
  text: d.text,
  kind: d.kind,
  required: d.required,
  ...(d.kind === "choice" ? { options: d.options.split(",").map((o) => o.trim()).filter(Boolean) } : {}),
});
let seq = 0;
const tempId = () => `new${Date.now().toString(36).slice(-4)}${seq++}`;

/**
 * Owner's screening questions for one listing. The Renter Passport already
 * covers identity, income, rental history, pets, and household, so this is for
 * what is specific to the home. Wording is checked for fair housing issues as
 * the owner types and again on the server.
 */
export function QuestionsEditor({
  open,
  onClose,
  listingId,
  title,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  listingId: string;
  title: string;
  initial: ScreeningQuestion[];
  onSaved: (msg: string) => void;
}) {
  const [rows, setRows] = useState<Draft[]>(() => initial.map(toDraft));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const patch = (i: number, x: Partial<Draft>) => setRows((r) => r.map((d, j) => (j === i ? { ...d, ...x } : d)));
  const add = (q?: Omit<ScreeningQuestion, "id">) =>
    rows.length < MAX_QUESTIONS &&
    setRows((r) => [...r, { id: tempId(), text: q?.text ?? "", kind: q?.kind ?? "text", required: q?.required ?? true, options: (q?.options ?? []).join(", ") }]);
  const unused = SUGGESTED.filter((s) => !rows.some((r) => r.text === s.text));

  async function save() {
    setBusy(true);
    setFormError("");
    // Temporary ids are replaced by the server.
    const questions = rows.filter((r) => r.text.trim()).map((d) => fromDraft({ ...d, id: d.id.startsWith("new") ? "" : d.id }));
    const res = await send(`/api/listings/${listingId}`, "PATCH", { questions });
    setBusy(false);
    if (res.errors) {
      // Server errors are keyed by position among the non empty rows.
      const kept = rows.map((r, i) => [r, i] as const).filter(([r]) => r.text.trim());
      setErrors(Object.fromEntries(Object.entries(res.errors).map(([k, v]) => [kept[Number(k.slice(1))]?.[0].id ?? k, v])));
      return setFormError("Fix the highlighted questions.");
    }
    if (res.error) return setFormError(res.error);
    onSaved(questions.length ? `Saved ${questions.length} ${questions.length === 1 ? "question" : "questions"} for ${title}.` : `Removed the questions from ${title}.`);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Questions for applicants"
      description={`Renters answer these when they request ${title}. Their Renter Passport already covers ID, income, rental history, pets, and household, so ask about the home.`}
      size="lg"
      submitLabel="Save questions"
      busy={busy}
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {rows.length === 0 && <p className="rounded-xl bg-sand p-4 body-6 text-ink-2">No questions yet. Add your own or start from a suggestion below.</p>}
      <ol className="flex flex-col gap-4">
        {rows.map((d, i) => {
          const issue = fairHousingIssue(`${d.text} ${d.kind === "choice" ? d.options : ""}`);
          const err = errors[d.id] || issue;
          return (
            <li key={d.id} className="rounded-xl border border-line p-4">
              <div className="flex items-start gap-2">
                <span className="mt-3 caption-3 text-ink-3">{i + 1}.</span>
                <div className="flex flex-1 flex-col gap-2">
                  <label className="sr-only" htmlFor={`qt-${d.id}`}>
                    Question {i + 1}
                  </label>
                  <input
                    id={`qt-${d.id}`}
                    className={fieldCls}
                    value={d.text}
                    maxLength={160}
                    placeholder="Ask about the home, your terms, or timing"
                    aria-invalid={Boolean(err)}
                    onChange={(e) => {
                      patch(i, { text: e.target.value });
                      setErrors((x) => ({ ...x, [d.id]: "" }));
                    }}
                  />
                  <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
                    <Select
                      ariaLabel={`Answer type for question ${i + 1}`}
                      size="sm"
                      value={d.kind}
                      onChange={(v) => patch(i, { kind: v as QuestionKind })}
                      options={(Object.keys(KIND_LABEL) as QuestionKind[]).map((k) => ({ value: k, label: KIND_LABEL[k] }))}
                    />
                    {d.kind === "choice" ? (
                      <input
                        aria-label={`Choices for question ${i + 1}, separated by commas`}
                        className={`${fieldCls} h-10!`}
                        value={d.options}
                        placeholder="Choices, separated by commas"
                        onChange={(e) => patch(i, { options: e.target.value })}
                      />
                    ) : (
                      <span />
                    )}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 caption-4 text-ink-2">
                        <input type="checkbox" checked={d.required} onChange={(e) => patch(i, { required: e.target.checked })} className="size-4 accent-[var(--color-brand)]" />
                        Required
                      </label>
                      <button
                        type="button"
                        onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
                        className="focus-ring rounded px-2 py-1 caption-3 text-error hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {err && <p className="caption-5 text-error">{err}</p>}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {rows.length < MAX_QUESTIONS ? (
        <button type="button" onClick={() => add()} className="btn-secondary button-sm self-start">
          <PlusIcon className="size-4" /> Add a question
        </button>
      ) : (
        <p className="caption-5 text-ink-3">Up to {MAX_QUESTIONS} questions. Fewer questions get more requests.</p>
      )}
      {unused.length > 0 && rows.length < MAX_QUESTIONS && (
        <div>
          <p className="title-4 text-ink">Suggestions</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {unused.map((q) => (
              <li key={q.text}>
                <button
                  type="button"
                  onClick={() => add(q)}
                  className="focus-ring inline-flex items-center gap-1 rounded-full border border-line px-3 py-1 caption-4 text-ink transition-colors duration-300 ease-base hover:border-ink"
                >
                  <PlusIcon className="size-3" /> {q.text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="rounded-xl bg-sand p-4 caption-5 text-ink-2">
        Fair housing: do not ask about race, color, religion, national origin, sex, gender identity, sexual orientation,
        familial or marital status, disability, age, or source of income. Ask every applicant the same questions. Questions
        that look like they touch these are blocked.
      </p>
      {formError && (
        <p role="alert" className="caption-2 text-error">
          {formError}
        </p>
      )}
    </Dialog>
  );
}
