export interface GiftConfirmationRow {
  id: string;
  sku_slug: string;
  size_label: string | null;
  quantity: number | null;
  preview_image_url: string | null;
}

export function giftConfirmationData(orderId: string, rows: GiftConfirmationRow[]) {
  return {
    orderId,
    items: rows.map((row) => ({
      productName: row.sku_slug === "pet-portrait-sculpture" ? "Pet Portrait Sculpture" : "Pet Memorial Sculpture",
      sizeLabel: row.size_label ?? "",
      previewImageUrl: row.preview_image_url ?? "",
      skuSlug: row.sku_slug,
      quantity: Math.max(1, Number(row.quantity ?? 1)),
    })),
  };
}

export const giftConfirmationAdminCopyKey = (orderId: string) => `originals-confirmation-admin-${orderId}`;