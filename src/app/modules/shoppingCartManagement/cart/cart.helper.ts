import mongoose from "mongoose";
import { TOptionalAuthGuardPayload } from "../../../types/common";

const findCartQuery = (user: TOptionalAuthGuardPayload) => {
  const query: { userId?: mongoose.Types.ObjectId; sessionId?: string } = {};
  if (user.isAuthenticated) {
    query.userId = user.id;
  } else {
    query.sessionId = user.sessionId;
  }
  return query;
};

export const CartHelper = { findCartQuery };
