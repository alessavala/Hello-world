import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { getOrCreateReferralCode } from "~/models/referrals.server";

// Called from the storefront (via the app proxy at /apps/referrals/link) to fetch
// or create the logged-in customer's referral code and shareable link.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.public.appProxy(request);

  if (!session || !admin) {
    return json({ error: "Shop not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const customerId = url.searchParams.get("logged_in_customer_id");

  if (!customerId) {
    return json({ error: "Customer must be logged in" }, { status: 401 });
  }

  const referralCode = await getOrCreateReferralCode(admin, session.shop, customerId, null);

  const shareUrl = `https://${session.shop}/apps/referrals/click?code=${referralCode.code}`;

  return json({ code: referralCode.code, url: shareUrl, clicks: referralCode.clicks });
};
