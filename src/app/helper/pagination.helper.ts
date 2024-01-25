import { SortOrder } from "mongoose";

export type TSortOption = { [key: string]: SortOrder };

export type TOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
};

export type TOptionsReturn = {
  page: number;
  limit: number;
  skip: number;
  sortOption: TSortOption;
};

const calculatePagination = (options: TOptions): TOptionsReturn => {
  const page = Number(options.page) || 1;
  let limit = Number(options.limit) || 20;
  limit = limit > 50 ? 50 : limit;
  const skip = (page - 1) * limit;
  const sortBy = options.sortBy || "createdAt";
  const sortOrder = options.sortOrder || "desc";
  const sortOption: TSortOption = {};

  if (sortBy && sortOrder) {
    sortOption[sortBy] = sortOrder;
  }
  return {
    page,
    limit,
    skip,
    sortOption,
  };
};

export const PaginationHelper = { calculatePagination };
