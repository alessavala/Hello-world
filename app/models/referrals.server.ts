import prisma from "~/db.server";
import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

export async function getOrCreateSettings(shop: string) {
  const existing = await prisma.referralSettings.findUnique({ where: { shop } });
  if (existing) return existing;

  return prisma.referralSettings.create({
    data: {
      shop,
      referrerRewardPercent: Number(process.env.DEFAULT_REFERRER_REWARD_PERCENT ?? 10),
      refereeRewardPercent: Number(process.env.DEFAULT_REFEREE_REWARD_PERCENT ?? 10),
    },
  });
}

export async function updateSettings(
  shop: string,
  data: Partial<{
    isEnabled: boolean;
    referrerRewardPercent: number;
    refereeRewardPercent: number;
    rewardDiscountDays: number;
  }>,
) {
  return prisma.referralSettings.upsert({
    where: { shop },
    update: data,
    create: { shop, ...data },
  });
}

// Creates a unique, shareable referral code for a customer, and a matching
// percentage-off discount code in Shopify that the customer's friends can redeem.
export async function getOrCreateReferralCode(
  admin: AdminApiContext,
  shop: string,
  customerId: string,
  customerEmail: string | null,
) {
  const existing = await prisma.referralCode.findUnique({
    where: { shop_customerId: { shop, customerId } },
  });
  if (existing) return existing;

  const settings = await getOrCreateSettings(shop);
  const code = `REF-${randomCode()}`;

  const discountId = await createRefereeDiscount(admin, code, settings.refereeRewardPercent, settings.rewardDiscountDays);

  return prisma.referralCode.create({
    data: {
      shop,
      customerId,
      customerEmail,
      code,
      discountId,
    },
  });
}

async function createRefereeDiscount(
  admin: AdminApiContext,
  code: string,
  percentage: number,
  activeDays: number,
) {
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + activeDays * 24 * 60 * 60 * 1000).toISOString();

  const response = await admin.graphql(
    `#graphql
    mutation CreateReferralDiscount($basicCodeDiscount: DiscountCodeBasicInput!) {
      discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
        codeDiscountNode {
          id
        }
        userErrors {
          field
          message
        }
      }
    }`,
    {
      variables: {
        basicCodeDiscount: {
          title: `Referral code ${code}`,
          code,
          startsAt,
          endsAt,
          customerSelection: { all: true },
          customerGets: {
            value: { percentage: percentage / 100 },
            items: { all: true },
          },
          appliesOncePerCustomer: true,
          usageLimit: 1,
        },
      },
    },
  );

  const json = await response.json();
  const result = json.data?.discountCodeBasicCreate;
  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "));
  }
  return result?.codeDiscountNode?.id ?? null;
}

export async function recordClick(code: string) {
  await prisma.referralCode.updateMany({
    where: { code },
    data: { clicks: { increment: 1 } },
  });
}

export async function listReferrals(shop: string) {
  return prisma.referral.findMany({
    where: { shop },
    include: { referralCode: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listReferralCodes(shop: string) {
  return prisma.referralCode.findMany({
    where: { shop },
    include: { referrals: true },
    orderBy: { createdAt: "desc" },
  });
}

export interface OrderWebhookPayload {
  id: string;
  name?: string;
  email?: string;
  total_price?: string;
  discount_codes?: { code: string }[];
}

// Called from the orders/paid webhook. If the order redeemed a known referral
// discount code, credits the referrer with a new reward discount code.
export async function processOrderForReferral(
  admin: AdminApiContext,
  shop: string,
  order: OrderWebhookPayload,
) {
  const usedCode = order.discount_codes?.find((dc) => dc.code?.startsWith("REF-"));
  if (!usedCode) return null;

  const referralCode = await prisma.referralCode.findUnique({
    where: { code: usedCode.code },
  });
  if (!referralCode || referralCode.shop !== shop) return null;

  const orderId = String(order.id);
  const already = await prisma.referral.findUnique({
    where: { shop_refereeOrderId: { shop, refereeOrderId: orderId } },
  });
  if (already) return already;

  const settings = await getOrCreateSettings(shop);
  const referral = await prisma.referral.create({
    data: {
      shop,
      referralCodeId: referralCode.id,
      refereeOrderId: orderId,
      refereeOrderName: order.name,
      refereeEmail: order.email,
      orderTotal: order.total_price ? Number(order.total_price) : null,
      rewardStatus: "pending",
    },
  });

  try {
    const rewardCode = `THX-${randomCode()}`;
    await createRefereeDiscount(admin, rewardCode, settings.referrerRewardPercent, settings.rewardDiscountDays);
    await prisma.referral.update({
      where: { id: referral.id },
      data: { rewardDiscountCode: rewardCode, rewardStatus: "issued" },
    });
  } catch (error) {
    await prisma.referral.update({
      where: { id: referral.id },
      data: { rewardStatus: "failed" },
    });
    console.error("Failed to issue referrer reward", error);
  }

  return referral;
}
