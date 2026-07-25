import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { BlockStack, Card, InlineGrid, Layout, Page, Text } from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { getOrCreateSettings, listReferralCodes, listReferrals } from "~/models/referrals.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const [settings, codes, referrals] = await Promise.all([
    getOrCreateSettings(shop),
    listReferralCodes(shop),
    listReferrals(shop),
  ]);

  const issuedRewards = referrals.filter((r) => r.rewardStatus === "issued").length;
  const totalClicks = codes.reduce((sum, c) => sum + c.clicks, 0);
  const totalSales = referrals.reduce((sum, r) => sum + (r.orderTotal ?? 0), 0);

  return json({
    settings,
    stats: {
      participants: codes.length,
      totalClicks,
      completedReferrals: referrals.length,
      issuedRewards,
      totalSales,
    },
  });
};

export default function Index() {
  const { settings, stats } = useLoaderData<typeof loader>();

  return (
    <Page title="Referral Rewards">
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Program status
                </Text>
                <Text as="p" tone={settings.isEnabled ? "success" : "critical"}>
                  {settings.isEnabled ? "Active" : "Disabled"} — referrers get{" "}
                  {settings.referrerRewardPercent}% off, referred friends get{" "}
                  {settings.refereeRewardPercent}% off, discounts valid for{" "}
                  {settings.rewardDiscountDays} days.
                </Text>
              </BlockStack>
            </Card>

            <InlineGrid columns={{ xs: 1, sm: 2, md: 4 }} gap="400">
              <StatCard label="Participants" value={stats.participants} />
              <StatCard label="Link clicks" value={stats.totalClicks} />
              <StatCard label="Completed referrals" value={stats.completedReferrals} />
              <StatCard label="Rewards issued" value={stats.issuedRewards} />
            </InlineGrid>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text as="p" tone="subdued">
          {label}
        </Text>
        <Text as="p" variant="heading2xl">
          {value}
        </Text>
      </BlockStack>
    </Card>
  );
}
