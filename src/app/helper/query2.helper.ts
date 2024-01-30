const queryHelper = (queryParameter: Record<string, unknown>) => {
  const {
    page = 1,
    limit = 10,
    sortBy,
    sortOrder,
    minPrice,
    maxPrice,
    tags,
    startDate,
    endDate,
    language,
    provider,
    durationInWeeks,
    level,
  } = queryParameter;

  const currentPage = parseInt(page as string, 10);
  const currentLimit = parseInt(limit as string, 10);

  const query: Record<string, unknown> = {};

  if (minPrice && maxPrice) {
    query.price = { $gte: minPrice, $lte: maxPrice };
  }

  if (tags) {
    query["tags.name"] = { $regex: new RegExp(tags as string, "i") };
  }

  if (startDate && endDate) {
    query.startDate = { $gte: startDate };
    query.endDate = { $lte: endDate };
  }

  if (language) {
    query.language = { $regex: new RegExp(language as string, "i") };
  }

  if (provider) {
    query.provider = { $regex: new RegExp(provider as string, "i") };
  }

  if (durationInWeeks) {
    query.durationInWeeks = durationInWeeks;
  }

  if (level) {
    query["details.level"] = { $regex: new RegExp(level as string, "i") };
  }

  let sortOptions: string = "createdAt";

  if (sortBy) {
    sortOptions = (sortBy as string).split(",").join(" ");
  }

  if (sortOrder) {
    const s = sortOrder == "desc" ? "-" : "";
    sortOptions = Object.keys(query)
      .map((key) => s + key)
      .join(" ");
  }

  return { query, sortOptions, currentPage, currentLimit };
};

export default queryHelper;
