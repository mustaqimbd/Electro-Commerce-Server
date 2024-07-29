export type TReportsType =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "customDate"
  | "customRange";

export type TReportsQuery = {
  type: TReportsType;
  sort: string;
  customDate: string;
  startDate: string;
  endDate: string;
};
