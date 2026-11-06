import { test, expect } from "bun:test";
import { giftConfirmationData, giftConfirmationAdminCopyKey } from "./giftConfirmation.ts";

test("gift confirmation copy includes the customer's preview and no charge", () => {
  const data = giftConfirmationData("chente-order", [{ id: "chente-order", sku_slug: "pet-portrait-sculpture", size_label: "Petite", quantity: 1, preview_image_url: "https://example.com/chente-sand.jpg" }]);
  expect(data.items[0].previewImageUrl).toBe("https://example.com/chente-sand.jpg");
  expect(data.items[0].sizeLabel).toBe("Petite");
  expect(data).not.toHaveProperty("totalUsd");
  expect(data.items[0]).not.toHaveProperty("amountUsd");
});

test("admin copy has a separate stable key from the customer's confirmation", () => {
  expect(giftConfirmationAdminCopyKey("chente-order")).toBe("originals-confirmation-admin-chente-order");
  expect(giftConfirmationAdminCopyKey("chente-order")).not.toBe("originals-confirmation-chente-order");
});