// Pure order-calculation logic. Encodes the business-logic scenarios from the
// spec (discount, FOC "buy X get Y free", VAT, multi-product totals).

/** Round to n decimals (OMR uses 3 decimal places). */
export function round(value, decimals = 3) {
  const f = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
}

/**
 * FOC: Buy `buyQty` get `freeQty` free.
 * Scenario 3: buy 10 get 1 free, ordered 25 -> floor(25/10)*1 = 2.
 */
export function calcFoc(quantity, buyQty, freeQty) {
  if (!buyQty || !freeQty || buyQty <= 0 || freeQty <= 0) return 0;
  return Math.floor(quantity / buyQty) * freeQty;
}

/**
 * Compute a single line.
 * gross = rate * quantity
 * discount = gross * disc%
 * lineTotal = gross - discount
 */
export function computeLine({ rate, quantity, discountPercentage = 0, focQuantity = 0 }) {
  const grossAmount = round(rate * quantity);
  const discountAmount = round(grossAmount * (discountPercentage / 100));
  const lineTotal = round(grossAmount - discountAmount);
  return {
    grossAmount,
    discountAmount,
    lineTotal,
    focQuantity: focQuantity || 0,
  };
}

/**
 * Compute order-level totals from already-computed line items.
 * netAmount = subtotal - totalDiscount
 * vat = netAmount * vat%
 * grandTotal = netAmount + vat
 */
export function computeOrderTotals(lines, vatPercent = 0) {
  const subtotal = round(lines.reduce((s, l) => s + l.grossAmount, 0));
  const totalDiscount = round(lines.reduce((s, l) => s + l.discountAmount, 0));
  const totalFoc = lines.reduce((s, l) => s + (l.focQuantity || 0), 0);
  const netAmount = round(subtotal - totalDiscount);
  const vatAmount = round(netAmount * (vatPercent / 100));
  const grandTotal = round(netAmount + vatAmount);
  return { subtotal, totalDiscount, totalFoc, netAmount, vatPercent, vatAmount, grandTotal };
}

/**
 * Build a fully-priced line from a product doc + requested input.
 * Uses the requested discount/foc if provided, else falls back to the
 * product's configured discount % and FOC scheme.
 */
export function buildPricedItem(product, input) {
  const quantity = Number(input.quantity);
  const rate = input.rate != null ? Number(input.rate) : Number(product.sellingPrice);
  const discountPercentage =
    input.discountPercentage != null
      ? Number(input.discountPercentage)
      : Number(product.discountPercentage || 0);

  // FOC: use explicit value if supplied, otherwise derive from product scheme.
  const focQuantity =
    input.focQuantity != null
      ? Number(input.focQuantity)
      : calcFoc(quantity, product.focBuyQuantity, product.focFreeQuantity);

  const computed = computeLine({ rate, quantity, discountPercentage, focQuantity });

  return {
    product: product._id,
    productCode: product.productCode,
    productName: product.productName,
    brand: product.brand,
    quantity,
    rate,
    discountPercentage,
    focQuantity: computed.focQuantity,
    grossAmount: computed.grossAmount,
    discountAmount: computed.discountAmount,
    lineTotal: computed.lineTotal,
  };
}
