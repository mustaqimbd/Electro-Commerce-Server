import { Model } from "mongoose";
import { FilterQuery, Query, PipelineStage } from "mongoose";

export class QueryHelper<T> {
  model: Query<T[], T>;
  query: Record<string, unknown>;

  constructor(model: Query<T[], T>, query: Record<string, unknown>) {
    this.model = model;
    this.query = query;
  }
  search(searchFields: string[]): this {
    const search = this.query?.search;
    if (search) {
      const searchConditions = searchFields.map((field) => ({
        [field]: { $regex: new RegExp(search as string, "i") },
      }));
      this.model = this.model.find({ $or: searchConditions } as FilterQuery<T>);
    }
    return this;
  }
  filterByCategory(): this {
    const category = this.query?.category;
    if (category) {
      this.model = this.model.find({ category: { $in: category } });
    }
    return this;
  }
  filterByStock(): this {
    const stock = this.query?.stock;
    if (stock) {
      this.model = this.model.find({ "inventory.stockStatus": stock });
    }
    return this;
  }
  sort(): this {
    const sort = this.query?.sort;
    if (sort) {
      this.model = this.model.sort((sort as string).split(",").join(" "));
    }
    return this;
  }
  paginate(): this {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const skip = (page - 1) * limit;
    this.model = this.model.skip(skip).limit(limit);
    return this;
  }
  select(): this {
    const select = this.query?.select;
    if (select) {
      this.model = this.model.select((select as string).split(",").join(" "));
    }
    return this;
  }
  async metaData(): Promise<{
    page: number;
    limit: number;
    total: number;
    totalPage: number;
  }> {
    const filter = this.model.getFilter();
    const total = await this.model.model.countDocuments(filter);
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);
    return { page, limit, total, totalPage };
  }
}

type CustomPipelineStage = {
  $facet?: { data: Record<string, unknown>[] };
  // Define other possible stages as needed
};

type ExtendedPipelineStage = PipelineStage & CustomPipelineStage;

export class UpdateAggregateQueryHelper<T> {
  model: Model<T>;
  pipeline: ExtendedPipelineStage[];
  query: Record<string, unknown>;

  constructor(
    model: Model<T>,
    pipeline: ExtendedPipelineStage[],
    query: Record<string, unknown>
  ) {
    this.model = model;
    this.pipeline = pipeline; // No need for type assertion here
    this.query = query;
  }

  search(searchableFields: string[]) {
    const search = this.query?.search;
    if (search) {
      const searchConditions = searchableFields.map((field) => ({
        [field]: { $regex: new RegExp(search as string, "i") },
      }));

      // Check if the pipeline already includes a $facet stage
      const facetStageIndex = this.pipeline.findIndex(
        (stage) => stage.$facet !== undefined
      );
      if (facetStageIndex !== -1) {
        // Push the $match stage into the existing $facet stage
        this.pipeline[facetStageIndex].$facet!.data.push({
          $match: { $or: searchConditions },
        });
      }
    }
    return this;
  }
  sort(): this {
    const sort = this.query?.sort;
    if (sort) {
      // this.model = this.model.sort((sort as string).split(",").join(" "));
      const facetStageIndex = this.pipeline.findIndex(
        (stage) => stage.$facet !== undefined
      );
      if (facetStageIndex !== -1) {
        this.pipeline[facetStageIndex].$facet!.data.push({
          $sort: (sort as string).split(",").join(" "),
        });
      }
    }
    return this;
  }
  paginate(): this {
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const skip = (page - 1) * limit;
    // this.model = this.model.skip(skip).limit(limit);
    const facetStageIndex = this.pipeline.findIndex(
      (stage) => stage.$facet !== undefined
    );
    if (facetStageIndex !== -1) {
      // Push the $match stage into the existing $facet stage
      this.pipeline[facetStageIndex].$facet!.data.push(
        {
          $skip: skip,
        },
        {
          $limit: limit,
        }
      );
    }
    return this;
  }
  async metaData() {
    const result = await this.model.aggregate(this.pipeline);
    const { data, total } = result[0];
    const page = Number(this.query?.page) || 1;
    const limit = Number(this.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);
    const meta = { page, limit, total: total, totalPage };
    return { data, meta };
  }
}
