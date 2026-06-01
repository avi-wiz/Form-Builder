import { createFileRoute } from "@tanstack/react-router";
import { BuilderShell } from "@/components/builder/BuilderShell";

export const Route = createFileRoute("/forms/builder/$formId")({
  head: ({ params }) => ({ meta: [{ title: `Builder · ${params.formId}` }] }),
  component: Builder,
});

function Builder() {
  const { formId } = Route.useParams();
  return <BuilderShell formId={formId} />;
}
