import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import {
  BlockStack,
  Card,
  Checkbox,
  Page,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "~/shopify.server";
import { getOrCreateSettings, updateSettings } from "~/models/referrals.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getOrCreateSettings(session.shop);
  return json({ settings });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const settings = await updateSettings(session.shop, {
    isEnabled: form.get("isEnabled") === "true",
    referrerRewardPercent: Number(form.get("referrerRewardPercent")),
    refereeRewardPercent: Number(form.get("refereeRewardPercent")),
    rewardDiscountDays: Number(form.get("rewardDiscountDays")),
  });

  return json({ settings, saved: true });
};

export default function Settings() {
  const { settings } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const submit = useSubmit();
  const navigation = useNavigation();
  const shopify = useAppBridge();

  const current = actionData?.settings ?? settings;

  useEffect(() => {
    if (actionData?.saved) {
      shopify.toast.show("Settings saved");
    }
  }, [actionData, shopify]);

  function save(next: Partial<typeof current>) {
    const merged = { ...current, ...next };
    const formData = new FormData();
    formData.set("isEnabled", String(merged.isEnabled));
    formData.set("referrerRewardPercent", String(merged.referrerRewardPercent));
    formData.set("refereeRewardPercent", String(merged.refereeRewardPercent));
    formData.set("rewardDiscountDays", String(merged.rewardDiscountDays));
    submit(formData, { method: "post" });
  }

  const isSaving = navigation.state === "submitting";

  return (
    <Page title="Referral program settings">
      <Card>
        <BlockStack gap="400">
          <Checkbox
            label="Program enabled"
            checked={current.isEnabled}
            disabled={isSaving}
            onChange={(value) => save({ isEnabled: value })}
          />

          <BlockStack gap="200">
            <Text as="p">Reward for the person who refers a friend</Text>
            <RangeSlider
              label={`${current.referrerRewardPercent}% off their next order`}
              min={0}
              max={50}
              value={current.referrerRewardPercent}
              disabled={isSaving}
              onChange={(value) => save({ referrerRewardPercent: value as number })}
              output
            />
          </BlockStack>

          <BlockStack gap="200">
            <Text as="p">Reward for the referred friend</Text>
            <RangeSlider
              label={`${current.refereeRewardPercent}% off their first order`}
              min={0}
              max={50}
              value={current.refereeRewardPercent}
              disabled={isSaving}
              onChange={(value) => save({ refereeRewardPercent: value as number })}
              output
            />
          </BlockStack>

          <TextField
            label="Discount code validity (days)"
            type="number"
            autoComplete="off"
            value={String(current.rewardDiscountDays)}
            disabled={isSaving}
            onChange={(value) => save({ rewardDiscountDays: Number(value) || 1 })}
          />
        </BlockStack>
      </Card>
    </Page>
  );
}
