import { Request } from "express";

const updatedPriceData = (req: Request) => {
  const { price } = req.body;
  const calculatedPrice: Record<string, unknown> = {};
  if (price && price.salePrice) {
    calculatedPrice.discountPercent = Number(
      (
        ((price.regularPrice - price.salePrice) / price.regularPrice) *
        100
      ).toFixed(2)
    );
    req.body.price = { ...price, ...calculatedPrice };
    return;
  }
  if (price && price.discountPercent) {
    calculatedPrice.salePrice = Number(
      (
        price.regularPrice -
        price.regularPrice * (price.discountPercent / 100)
      ).toFixed(2)
    );
    req.body.price = { ...price, ...calculatedPrice };
  }
};

export default updatedPriceData;
