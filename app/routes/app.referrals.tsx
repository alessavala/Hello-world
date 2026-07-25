import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Badge, Card, DataTable, Page } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { listReferrals } from "~/models/referrals.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const referrals = await listReferrals(session.shop);
  return json({ referrals });
};

export default function Referrals() {
  const { referrals } = useLoaderData<typeof loader>();

  const rows = referrals.map((r) => [
    r.referralCode.customerEmail ?? r.referralCode.customerId,
    r.refereeOrderName ?? r.refereeOrderId,
    r.refereeEmail ?? "—",
    r.orderTotal ? `$${r.orderTotal.toFixed(2)}` : "—",
    r.rewardDiscountCode ?? "—",
    <Badge key={r.id} tone={statusTone(r.rewardStatus)}>
      {r.rewardStatus}
    </Badge>,
  ]);

  return (
    <Page title="Referrals" subtitle="Every order placed with a referral code">
      <Card>
        <DataTable
          columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
          headings={["Referrer", "Order", "Referee email", "Order total", "Reward code", "Status"]}
          rows={rows}
          hasZebraStripingOnData
        />
      </Card>
    </Page>
  );
}

function statusTone(status: string): "success" | "warning" | "critical" {
  if (status === "issued") return "success";
  if (status === "failed") return "critical";
  return "warning";
}
