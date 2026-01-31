import { redirect } from "next/navigation"
import { pricingRoutes } from "@repo/lib/routes"

export default function Page() {
  redirect(pricingRoutes.pipeline())
}
