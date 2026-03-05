import { ApiReferencePage } from "@/components/api-reference/api-reference-page";

export const metadata = {
  title: "API Reference – dscr.ai",
  description:
    "Complete REST API reference for managing deals, loans, borrowers, entities, scenarios, and more.",
};

export default function Page() {
  return <ApiReferencePage />;
}
