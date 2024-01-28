import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { ProductServices } from "./product.service";

const createProduct = catchAsync(async (req, res, next) => {
  const createdBy = req.user.id;
  const result = await ProductServices.createProductIntoDB(
    createdBy,
    req.body,
    next
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Product created successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Parent Products retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const ProductId = req.params.id;
  const result = await ProductServices.updateProductIntoDB(
    createdBy,
    ProductId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const ProductId = req.params.id;
  await ProductServices.deleteProductFromDB(createdBy, ProductId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product deleted successfully",
    data: null,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
