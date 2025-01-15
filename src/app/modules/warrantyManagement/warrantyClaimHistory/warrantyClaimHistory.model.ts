import { model, Schema } from "mongoose";
import {
  TWarrantyClaimHistory,
  TWCHClaims,
} from "./warrantyClaimHistory.interface";

const WCHClaim = new Schema<TWCHClaims>({
  order_id: Schema.Types.ObjectId,
  itemId: Schema.Types.ObjectId,
  claimedCodes: [
    {
      type: String,
    },
  ],
});

const WarrantyClaimHistorySchema = new Schema<TWarrantyClaimHistory>(
  {
    parentOrder: {
      type: Schema.ObjectId,
      required: true,
    },
    parentItemId: {
      type: Schema.ObjectId,
      required: true,
    },
    claims: [WCHClaim],
  },
  { timestamps: true, versionKey: false }
);

export const WarrantyClaimHistory = model<TWarrantyClaimHistory>(
  "warranty_claim_histories",
  WarrantyClaimHistorySchema
);
