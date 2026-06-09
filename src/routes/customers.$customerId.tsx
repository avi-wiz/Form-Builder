import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy route — retailers used to live at /customers/:id. Redirect any bookmarks
// to the renamed /retailers/:id route.
export const Route = createFileRoute("/customers/$customerId")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/retailers/$retailerId", params: { retailerId: params.customerId } });
  },
});
