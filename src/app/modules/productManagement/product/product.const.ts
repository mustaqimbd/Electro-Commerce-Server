import { TPublishedStatus, TVisibilityStatus } from "./product.interface";

export const publishedStatus: TPublishedStatus[] = ["Draft", "Published"];
export const visibilityStatus: TVisibilityStatus[] = [
  "Public",
  "Private",
  "Password protected",
];

export const publishedStatusQuery: Record<TPublishedStatus, TPublishedStatus> =
  {
    Published: "Published",
    Draft: "Draft",
  };

export const visibilityStatusQuery: Record<
  TVisibilityStatus,
  TVisibilityStatus
> = {
  Public: "Public",
  Private: "Private",
  "Password protected": "Password protected",
};
