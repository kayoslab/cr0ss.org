import { revalidateTag, revalidatePath } from "next/cache";

// safe to call in Route Handlers (Edge or Node)
export function revalidateDashboard() {
  revalidateTag("dashboard");
  revalidatePath("/dashboard", "page");
}