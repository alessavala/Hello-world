import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { recordClick } from "~/models/referrals.server";

// Called when someone clicks a shared referral link (/apps/referrals/click?code=REF-XXXX).
// Records the click, then hands off to Shopify's native discount deep link, which applies
// the code and drops the shopper on the storefront home page.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!session || !code) {
    return redirect(`https://${session?.shop ?? ""}/`);
  }

  await recordClick(code);

  return redirect(`https://${session.shop}/discount/${encodeURIComponent(code)}?redirect=/`);
};
