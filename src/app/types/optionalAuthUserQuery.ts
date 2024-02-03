import mongoose from "mongoose";
import { TOptionalAuthGuardPayload } from "./common";

const optionalAuthUserQuery = (user: TOptionalAuthGuardPayload) => {
  const query: { userId?: mongoose.Types.ObjectId; sessionId?: string } = {};
  if (user.isAuthenticated) {
    query.userId = user.id;
  } else {
    query.sessionId = user.sessionId;
  }
  return query;
};

export default optionalAuthUserQuery;
