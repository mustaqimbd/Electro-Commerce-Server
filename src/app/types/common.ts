import { TResponseMeta } from "../utilities/successResponse";

export type TMetaAndDataRes<T> = {
  meta: TResponseMeta;
  data: T | null;
};
