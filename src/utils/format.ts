
const priceFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric price as Indian Rupees.
 * Examples: 2999 -> "₹2,999", 2999.5 -> "₹2,999.5"
 */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price < 0) {
    throw new TypeError(
      "Price must be a finite, non-negative number.",
    );
  }

  return priceFormatter.format(price);
}

/**
 * Parses a numeric value or formatted price string into a number.
 * Returns 0 for invalid input to match the existing test contract.
 */
export function parsePrice(value: string | number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  const normalized = value.trim().replace(/[₹,\s]/g, "");

  if (!normalized || !/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    return 0;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
