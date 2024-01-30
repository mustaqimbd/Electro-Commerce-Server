import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { ProductServices } from "./product.service";

const createProduct = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const result = await ProductServices.createProductIntoDB(createdBy, req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Product created successfully",
    data: result,
  });
});

const getProduct = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ProductServices.getProductFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All Products retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  const updatedBy = req.user.id;
  const ProductId = req.params.id;
  const result = await ProductServices.updateProductIntoDB(
    updatedBy,
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
  const deletedBy = req.user.id;
  const ProductId = req.params.id;
  await ProductServices.deleteProductFromDB(deletedBy, ProductId);

  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product deleted successfully",
    data: null,
  });
});

export const ProductControllers = {
  createProduct,
  getProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
};
