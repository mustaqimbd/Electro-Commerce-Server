// import { FilterQuery, Query } from "mongoose";

// class QueryBuilder<T>{
//     public queryModel: Query<T[], T>
//     public query: Record<string, unknown>

//     constructor(queryModel: Query<T[], T>, query: Record<string, unknown>) {

//         this.queryModel = queryModel,
//         this.query = query
//     }

//     search(searchableFields: string[]) {
//         const search = this.query?.search

//         if (search) {
//             const searchConditions = searchableFields.map((field) => ({
//                 [field]: { $regex: new RegExp(search as string, 'i') }
//             }));

//             this.queryModel = this.queryModel.find(
//                 { $or: searchConditions } as FilterQuery<T>
//             )
//         }
//         return this
//     }

//     filter() {
//         const queryObj = { ...this.query }
//         // filtering
//         const excludeFields = ['search', 'sort', 'limit', 'page', 'fields']
//         excludeFields.forEach(el => delete queryObj[el])
//         this.queryModel = this.queryModel.find(queryObj as FilterQuery<T>)

//         return this
//     }

//     sort() {
//         const sort = (this.query?.sort as string)?.split(',').join(' ') || "-createdAt"
//         this.queryModel = this.queryModel.sort(sort as string)
//         return this
//     }

//     paginate() {
//         const page = Number(this.query?.page) || 1
//         const limit = Number(this.query?.limit) || 5
//         const skip = (page - 1) * limit
//         this.queryModel = this.queryModel.skip(skip).limit(limit)
//         return this
//     }

//     fields() {
//         const fields = (this.query?.fields as string)?.split(',').join(' ') || '-__v'
//         this.queryModel = this.queryModel.select(fields)
//         return this
//     }

//     async countTotal() {
//         const filter = this.queryModel.getFilter()
//         const total = await this.queryModel.model.countDocuments(filter)
//         const page = Number(this.query?.page) || 1
//         const limit = Number(this.query?.limit) || 5
//         const totalPage = Math.ceil(limit / page)
//         return { page, limit, total, totalPage }
//     }

// }

// export default QueryBuilder
