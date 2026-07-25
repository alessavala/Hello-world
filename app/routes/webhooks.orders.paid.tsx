import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { processOrderForReferral, type OrderWebhookPayload } from "~/models/referrals.server";

// Fired whenever an order is paid. If the order redeemed a referral discount code,
// this issues a reward discount code to the original referrer.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, admin, payload } = await authenticate.webhook(request);

  if (!admin) {
    throw new Response("No admin session for shop", { status: 401 });
  }

  await processOrderForReferral(admin, shop, payload as OrderWebhookPayload);

  return new Response();
};
