// All the order math lives here - no DB, just numbers, so it's easy to reuse
// and test. Handles discounts, the FOC "buy X get Y free" rule, VAT and totals.

// round to n decimals (OMR works in 3 - the .EPSILON bit avoids float glitches)
export function round(value, decimals = 3) {
  const f = 10 ** decimals;
  return Math.round((Number(value) + Number.EPSILON) * f) / f;
}

// FOC = buy `buyQty`, get `freeQty` free.
// e.g. buy 10 get 1, order 25 -> floor(25/10) * 1 = 2 free
export function calcFoc(quantity, buyQty, freeQty) {
  if (!buyQty || !freeQty || buyQty <= 0 || freeQty <= 0) return 0;
  return Math.floor(quantity / buyQty) * freeQty;
}

// one line: gross = rate*qty, discount comes off that, total is what's left
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

// roll the lines up into the order totals. VAT is charged on the net (after discount).
export function computeOrderTotals(lines, vatPercent = 0) {
  const subtotal = round(lines.reduce((s, l) => s + l.grossAmount, 0));
  const totalDiscount = round(lines.reduce((s, l) => s + l.discountAmount, 0));
  const totalFoc = lines.reduce((s, l) => s + (l.focQuantity || 0), 0);
  const netAmount = round(subtotal - totalDiscount);
  const vatAmount = round(netAmount * (vatPercent / 100));
  const grandTotal = round(netAmount + vatAmount);
  return { subtotal, totalDiscount, totalFoc, netAmount, vatPercent, vatAmount, grandTotal };
}

// turn a product + whatever the request sent into a fully priced line.
// if the request didn't send rate/discount/foc we just use the product's own values.
export function buildPricedItem(product, input) {
  const quantity = Number(input.quantity);
  const rate = input.rate != null ? Number(input.rate) : Number(product.sellingPrice);
  const discountPercentage =
    input.discountPercentage != null
      ? Number(input.discountPercentage)
      : Number(product.discountPercentage || 0);

  // take the FOC value if they sent one, otherwise work it out from the product
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
