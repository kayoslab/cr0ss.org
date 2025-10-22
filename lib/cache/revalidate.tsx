import { revalidateTag, revalidatePath } from "next/cache";
import { CACHE_TAGS } from "@/lib/constants/cache";
import { PATHS } from "@/lib/constants/paths";

// safe to call in Route Handlers (Edge or Node)
export function revalidateDashboard() {
  revalidateTag(CACHE_TAGS.DASHBOARD);
  revalidatePath(PATHS.DASHBOARD, "page");
}