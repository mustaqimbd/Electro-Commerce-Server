export type TPeriod =
  | "today"
  | "yesterday"
  | "thisWeek"
  | "lastWeek"
  | "thisMonth"
  | "lastMonth"
  | "thisYear"
  | "lastYear"
  | "yearly"
  | "customDate"
  | "customRange";

export type TReportsQuery = {
  type: TPeriod;
  sort: string;
  customDate: string;
  startDate: string;
  endDate: string;
};
