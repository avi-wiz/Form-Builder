import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/forms-store";
import { FormRenderer } from "./forms.preview.$formId";

export const Route = createFileRoute("/forms/fill/$formSlug")({
  head: ({ params }) => ({ meta: [{ title: `Form · ${params.formSlug}` }] }),
  component: FillPage,
});

function FillPage() {
  const { formSlug } = Route.useParams();
  const store = useStore();
  const form = store.forms.find((f) => f.slug === formSlug);
  if (!form) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Form not found.</div>;
  return <FormRenderer form={form} standalone onSubmit={(v) => store.addSubmission({ id: "S_" + Date.now(), formId: form.id, submitterName: v["Company name"] ?? "Anonymous", submitterEmail: v["Email ID"] ?? "", status: "new", submittedAt: new Date().toISOString(), values: v })} />;
}
