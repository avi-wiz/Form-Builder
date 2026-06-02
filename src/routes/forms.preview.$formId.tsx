import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { Star, Upload, ArrowLeft, Sparkles, ExternalLink, Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Btn, Badge, Modal, Toast } from "@/components/ui-kit";
import { useStore, getSectionFields, type FormField, type Form, type FormRow } from "@/lib/forms-store";

export const Route = createFileRoute("/forms/preview/$formId")({
  head: ({ params }) => ({ meta: [{ title: `Preview · ${params.formId}` }] }),
  component: PreviewPage,
});

function PreviewPage() {
  const { formId } = Route.useParams();
  const navigate = useNavigate();
  const store = useStore();
  const form = store.getForm(formId);
  if (!form) return (
    <AppShell breadcrumb={[{ label: "Forms", to: "/forms" }, { label: "Preview" }]}>
      <div className="p-8 text-center text-muted-foreground">Form not found.</div>
    </AppShell>
  );
  const [simulate, setSimulate] = useState(false);

  const demoData = useMemo<Record<string, string>>(() => {
    const allFields = form.sections.flatMap((s) => getSectionFields(s));
    const result: Record<string, string> = {};
    for (const f of allFields) {
      if (!f.included) continue;
      const name = f.displayName.toLowerCase();
      if (f.type === "email" || name.includes("email")) {
        result[f.displayName] = "sarah@brightdecor.com";
      } else if (f.type === "phone" || name.includes("phone")) {
        result[f.displayName] = "+1 404-555-0192";
      } else if (f.type === "text" && (name.includes("company") || name.includes("business") || name.includes("name"))) {
        result[f.displayName] = "Bright Decor LLC";
      } else if (f.type === "text" && (name.includes("display") || name.includes("contact"))) {
        result[f.displayName] = "Sarah Chen";
      }
    }
    return result;
  }, [form]);

  return (
    <AppShell breadcrumb={[{ label: "Dashboard", to: "/forms" }, { label: "Forms", to: "/forms" }, { label: form.name, to: `/forms/builder/${form.id}` as never }, { label: "Preview" }]}>
      <div className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate({ to: "/forms/builder/$formId", params: { formId } })} className="rounded p-1 hover:bg-muted"><ArrowLeft className="h-4 w-4" /></button>
        <span className="text-sm text-muted-foreground">Previewing as a respondent · </span>
        <Link to="/forms/fill/$formSlug" params={{ formSlug: form.slug }} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          Open public link <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
      <div className="border-b border-border bg-card px-6 py-2 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={simulate}
            onChange={(e) => setSimulate(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
          <User className="h-4 w-4 text-muted-foreground" />
          <span>Simulate logged-in buyer</span>
        </label>
      </div>
      <FormRenderer
        form={form}
        prepopulatedValues={simulate ? demoData : undefined}
        onClearPrepopulation={() => setSimulate(false)}
        onSubmit={(v) => store.addSubmission({ id: "S_" + Date.now(), formId: form.id, submitterName: v["Company name"] ?? "Anonymous", submitterEmail: v["Email ID"] ?? "", status: "new", submittedAt: new Date().toISOString(), values: v })}
      />
    </AppShell>
  );
}

export function FormRenderer({ form, onSubmit, standalone = false, prepopulatedValues, onClearPrepopulation }: { form: Form; onSubmit?: (vals: Record<string, string>) => void; standalone?: boolean; prepopulatedValues?: Record<string, string>; onClearPrepopulation?: () => void }) {
  const [vals, setVals] = useState<Record<string, string>>(prepopulatedValues ?? {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [dedupOpen, setDedupOpen] = useState(false);
  const [thanksOpen, setThanksOpen] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setVals(prepopulatedValues ?? {});
  }, [prepopulatedValues]);

  const allFields = useMemo(() => form.sections.flatMap((s) => getSectionFields(s)), [form]);

  const isFieldVisible = (f: FormField): boolean => {
    if (!f.conditions || f.conditions.rules.length === 0) return true;
    const { logic, rules } = f.conditions;
    const results = rules.map((rule) => {
      const sourceField = allFields.find((x) => x.id === rule.fieldId);
      if (!sourceField) return true;
      const fieldVal = vals[sourceField.displayName] ?? "";
      switch (rule.operator) {
        case "equals":       return fieldVal === rule.value;
        case "not_equals":   return fieldVal !== rule.value;
        case "contains":     return fieldVal.includes(rule.value);
        case "is_blank":     return fieldVal === "";
        case "greater_than": return Number(fieldVal) > Number(rule.value);
        case "less_than":    return Number(fieldVal) < Number(rule.value);
        default:             return true;
      }
    });
    return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  };

  const visibleSections = useMemo(() => form.sections.filter((s) => s.show), [form]);
  const isMulti = form.multiStep && visibleSections.length > 1;
  const currentSections = isMulti ? [visibleSections[step]] : visibleSections;

  const set = (name: string, v: string) => setVals((p) => ({ ...p, [name]: v }));

  const validateCurrent = () => {
    const err: Record<string, string> = {};
    currentSections.forEach((s) => getSectionFields(s).forEach((f) => {
      if (!f.included || !isFieldVisible(f)) return;
      const val = vals[f.displayName] ?? "";
      if (f.required && !val) {
        err[f.displayName] = f.validationMessage ?? "Required";
        return;
      }
      if (val) {
        if (f.minLength != null && val.length < f.minLength) {
          err[f.displayName] = f.validationMessage ?? `Minimum ${f.minLength} characters required`;
        } else if (f.maxLength != null && val.length > f.maxLength) {
          err[f.displayName] = f.validationMessage ?? `Maximum ${f.maxLength} characters allowed`;
        } else if (f.validationPattern) {
          try {
            if (!new RegExp(f.validationPattern).test(val)) {
              err[f.displayName] = f.validationMessage ?? "Invalid format";
            }
          } catch {
            // invalid regex — skip
          }
        }
      }
    }));
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = () => {
    if (!validateCurrent()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      if (form.crm.action !== "none" && form.automation.kaiDedup) {
        setDedupOpen(true);
      } else {
        onSubmit?.(vals);
        triggerAfterSubmit();
      }
    }, 1000);
  };

  const triggerAfterSubmit = () => {
    const { mode, redirectUrl, delay } = form.afterSubmit;
    if (mode === "message" || mode === "both") {
      setThanksOpen(true);
    }
    if (mode === "redirect") {
      window.open(redirectUrl, "_blank");
    }
    if (mode === "both") {
      setTimeout(() => {
        setThanksOpen(false);
        window.open(redirectUrl, "_blank");
      }, (delay ?? 3) * 1000);
    }
  };

  const dedupMatches = [
    { type: "Customer", name: "Madison Creek Furnishings", email: "ops@madisoncreek.com", similarity: 94, initials: "MC" },
    { type: "Lead", name: "Madison Creek Designs", email: "hello@madisoncreek-designs.com", similarity: 87, initials: "MC" },
  ];

  return (
    <div className={standalone ? "min-h-screen bg-muted/40 py-6 sm:py-10" : "bg-muted/40 py-6 sm:py-8"}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-8">
          <h1 className="text-xl font-semibold">{form.name}</h1>
          {form.description && <p className="mt-1 text-sm text-muted-foreground">{form.description}</p>}

          {isMulti && <StepIndicator sections={visibleSections} step={step} />}

          <div className="mt-6 space-y-6">
            {currentSections.map((s) => (
              <section key={s.id}>
                <h2 className="mb-3 text-base font-semibold">{s.name}</h2>
                <div className="space-y-4">
                  {s.rows.map((row) => (
                    <RowRender
                      key={row.id}
                      row={row}
                      vals={vals}
                      errors={errors}
                      onChange={(name, v) => set(name, v)}
                      isFieldVisible={isFieldVisible}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          {prepopulatedValues && Object.keys(prepopulatedValues).length > 0 && onClearPrepopulation && (
            <div className="mt-4 text-right">
              <button
                type="button"
                onClick={onClearPrepopulation}
                className="text-xs text-primary hover:underline"
              >
                Not you? Clear form
              </button>
            </div>
          )}

          {/* Desktop / inline footer */}
          <div className="mt-8 hidden items-center justify-between sm:flex">
            {isMulti && step > 0 ? <Btn variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Btn> : <span />}
            {isMulti && step < visibleSections.length - 1
              ? <Btn onClick={() => validateCurrent() && setStep((s) => s + 1)}>Next</Btn>
              : <Btn onClick={handleSubmit} disabled={submitting}>{submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit"}</Btn>}
          </div>

          {/* Mobile spacer for sticky footer */}
          <div className="h-20 sm:hidden" />
        </div>
      </div>

      {/* Mobile sticky footer */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center gap-2 border-t border-border bg-card p-3 shadow-lg sm:hidden">
        {isMulti && step > 0 && (
          <button onClick={() => setStep((s) => s - 1)} className="inline-flex h-11 min-w-[44px] flex-1 items-center justify-center rounded-md border border-primary px-4 text-sm font-medium text-primary">Back</button>
        )}
        {isMulti && step < visibleSections.length - 1 ? (
          <button onClick={() => validateCurrent() && setStep((s) => s + 1)} className="inline-flex h-11 flex-[2] items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Next</button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="inline-flex h-11 flex-[2] items-center justify-center gap-1.5 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit"}
          </button>
        )}
      </div>

      {/* Submitting overlay */}
      {submitting && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-foreground/20 animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 shadow-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Submitting…</span>
          </div>
        </div>
      )}

      <KaiDedupModal
        open={dedupOpen}
        matches={dedupMatches}
        onDiscard={() => setDedupOpen(false)}
        onCreate={() => {
          setDedupOpen(false);
          onSubmit?.(vals);
          triggerAfterSubmit();
        }}
      />

      <Modal open={thanksOpen} onClose={() => { setThanksOpen(false); setVals({}); setStep(0); }} title="Submitted ✓">
        <div className="py-3 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-6 w-6" />
          </div>
          <div className="text-sm text-foreground whitespace-pre-line">{form.afterSubmit.message}</div>
          {form.afterSubmit.mode === "both" && form.afterSubmit.redirectUrl && (
            <p className="mt-2 text-xs text-muted-foreground">
              Redirecting in {form.afterSubmit.delay ?? 3}s…
            </p>
          )}
          {form.afterSubmit.mode === "redirect" && form.afterSubmit.redirectUrl && (
            <p className="mt-2 text-xs text-muted-foreground">
              Redirecting to <span className="text-primary">{form.afterSubmit.redirectUrl}</span>
            </p>
          )}
        </div>
      </Modal>

      <Toast open={!!toast} onClose={() => setToast("")} message={toast} />
    </div>
  );
}

function StepIndicator({ sections, step }: { sections: { id: string; name: string }[]; step: number }) {
  return (
    <>
      {/* Mobile compact */}
      <div className="mt-4 sm:hidden">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">Step {step + 1} of {sections.length}</span>
          <span className="text-muted-foreground">{sections[step].name}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${((step + 1) / sections.length) * 100}%` }} />
        </div>
      </div>
      {/* Desktop */}
      <div className="mt-5 hidden items-center gap-1.5 sm:flex">
        {sections.map((s, i) => {
          const done = i < step, current = i === step;
          return (
            <div key={s.id} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                done ? "bg-primary text-primary-foreground" :
                current ? "bg-card text-primary ring-2 ring-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={`truncate text-xs ${current ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{s.name}</span>
              {i < sections.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-primary" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>
    </>
  );
}

function KaiDedupModal({ open, matches, onDiscard, onCreate }: {
  open: boolean;
  matches: { type: string; name: string; email: string; similarity: number; initials: string }[];
  onDiscard: () => void;
  onCreate: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onDiscard}
      size="lg"
      title={<span className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-kai" /> Kai found potential duplicates</span>}
      footer={
        <>
          <Btn variant="outline" onClick={onDiscard}>Discard</Btn>
          <Btn onClick={onCreate}>Create Anyway</Btn>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">This submission looks similar to existing records. Review the matches below before continuing.</p>
      <div className="mt-3 text-sm font-semibold">{matches.length} possible match{matches.length === 1 ? "" : "es"}</div>
      <div className="mt-2 space-y-2">
        {matches.map((m, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {m.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">{m.name}</span>
                <Badge tone={m.type === "Customer" ? "info" : "primary"}>{m.type}</Badge>
              </div>
              <div className="truncate text-xs text-muted-foreground">{m.email}</div>
            </div>
            <Badge tone="warning">{m.similarity}% match</Badge>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function RowRender({ row, vals, errors, onChange, isFieldVisible }: { row: FormRow; vals: Record<string, string>; errors: Record<string, string>; onChange: (name: string, v: string) => void; isFieldVisible: (f: FormField) => boolean }) {
  if (row.kind === "richText") {
    return <div className="prose prose-sm max-w-none text-sm" dangerouslySetInnerHTML={{ __html: row.richText?.html ?? "" }} />;
  }
  if (row.kind === "divider") return <hr className="border-border" />;
  if (row.kind === "heading") {
    return row.heading?.level === 3
      ? <h3 className="text-base font-semibold">{row.heading?.text}</h3>
      : <h2 className="text-lg font-semibold">{row.heading?.text ?? ""}</h2>;
  }
  if (row.kind === "image" && row.image) {
    return (
      <div className={`flex ${row.image.align === "left" ? "justify-start" : row.image.align === "right" ? "justify-end" : "justify-center"}`}>
        <img src={row.image.src} alt={row.image.alt ?? ""} className="max-w-full rounded" />
      </div>
    );
  }
  if (row.kind !== "fields") return null;
  const fields = (row.fields ?? []).filter((f) => f.included && f.type !== "hidden" && isFieldVisible(f));
  if (fields.length === 0) return null;
  if (fields.length === 1) {
    const f = fields[0];
    return <FieldInput field={f} value={vals[f.displayName] ?? ""} onChange={(v) => onChange(f.displayName, v)} error={errors[f.displayName]} />;
  }
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:gap-4">
      {fields.map((f) => {
        const w = f.width === "third" ? "sm:basis-1/3" : f.width === "half" ? "sm:basis-1/2" : "sm:flex-1";
        return (
          <div key={f.id} className={`flex-1 ${w}`}>
            <FieldInput field={f} value={vals[f.displayName] ?? ""} onChange={(v) => onChange(f.displayName, v)} error={errors[f.displayName]} />
          </div>
        );
      })}
    </div>
  );
}

function FieldInput({ field, value, onChange, error }: { field: FormField; value: string; onChange: (v: string) => void; error?: string }) {
  const labelEl = (
    <label className="mb-1 block text-xs font-medium text-foreground">
      {field.displayName}{field.required && <span className="text-destructive"> *</span>}
    </label>
  );
  const cls = `w-full min-h-[44px] rounded-md border ${error ? "border-destructive" : "border-border"} bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none`;
  let input: React.ReactNode;
  switch (field.type) {
    case "long_text": case "html":
      input = <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} rows={3} className={cls} />; break;
    case "select":
      input = <select value={value} onChange={(e) => onChange(e.target.value)} className={cls}><option value="">Select...</option>{field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>; break;
    case "multi_select":
      input = <select multiple value={value ? value.split(",") : []} onChange={(e) => onChange(Array.from(e.target.selectedOptions).map((o) => o.value).join(","))} className={cls}>{field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>; break;
    case "radio":
      input = <div className="space-y-1.5">{field.options?.map((o) => (
        <label key={o.value} className="flex min-h-[44px] items-center gap-2 text-sm"><input type="radio" name={field.id} value={o.value} checked={value === o.value} onChange={(e) => onChange(e.target.value)} className="h-4 w-4" />{o.label}</label>
      ))}</div>; break;
    case "checkbox":
      input = <label className="flex min-h-[44px] items-center gap-2 text-sm"><input type="checkbox" checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))} className="h-4 w-4" /> Yes</label>; break;
    case "consent":
      input = <label className="flex min-h-[44px] items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4" checked={value === "true"} onChange={(e) => onChange(String(e.target.checked))} /><span>{field.consentText} {field.privacyUrl && <a href={field.privacyUrl} className="text-primary hover:underline">Privacy policy</a>}</span></label>; break;
    case "date":
      input = <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />; break;
    case "number": case "percentage":
      input = <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={cls} />; break;
    case "currency": {
      const hasBudgetRange = field.budgetMin !== undefined || field.budgetMax !== undefined;
      if (hasBudgetRange) {
        const [minVal, maxVal] = value ? value.split("–") : ["", ""];
        input = (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min={field.budgetMin}
                max={field.budgetMax}
                value={minVal ?? ""}
                onChange={(e) => onChange(`${e.target.value}–${maxVal ?? ""}`)}
                placeholder={field.budgetMin ?? "Min"}
                className={`${cls} pl-7`}
              />
            </div>
            <span className="shrink-0 text-sm text-muted-foreground">to</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
              <input
                type="number"
                min={field.budgetMin}
                max={field.budgetMax}
                value={maxVal ?? ""}
                onChange={(e) => onChange(`${minVal ?? ""}–${e.target.value}`)}
                placeholder={field.budgetMax ?? "Max"}
                className={`${cls} pl-7`}
              />
            </div>
          </div>
        );
      } else {
        input = (
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">$</span>
            <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder ?? "0.00"} className={`${cls} pl-7`} />
          </div>
        );
      }
      break;
    }
    case "email":
      input = <input type="email" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={cls} />; break;
    case "url":
      input = <input type="url" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={cls} />; break;
    case "phone":
      input = <input type="tel" value={value} onChange={(e) => onChange(e.target.value)} placeholder="+1 555 000 0000" className={cls} />; break;
    case "file":
      input = <div className={`${cls} flex items-center gap-2 text-muted-foreground`}><Upload className="h-4 w-4" /> Drop files or click to upload</div>; break;
    case "rating":
      input = <div className="flex gap-1">{Array.from({ length: field.ratingScale ?? 5 }).map((_, i) => (
        <button key={i} type="button" onClick={() => onChange(String(i + 1))} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center">
          <Star className={`h-6 w-6 ${Number(value) > i ? "fill-warning text-warning" : "text-muted-foreground"}`} />
        </button>
      ))}</div>; break;
    default:
      input = <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder} className={cls} />;
  }
  return (
    <div>
      {labelEl}
      {input}
      {field.helpText && <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
