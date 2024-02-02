import httpStatus from "http-status";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";
import { ProductServices } from "./product.service";
import updatedPriceData from "./utils";

const createProduct = catchAsync(async (req, res) => {
  updatedPriceData(req);
  const createdBy = req.user.id;
  const result = await ProductServices.createProductIntoDB(createdBy, req.body);

  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Product created successfully",
    data: result,
  });
});

const getAProductCustomer = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ProductServices.getAProductCustomerFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});

const getAProductAdmin = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await ProductServices.getAProductAdminFromDB(id);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Product retrieved successfully",
    data: result,
  });
});

const getAllProductsCustomer = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsCustomerFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All Products retrieved successfully",
    data: result,
  });
});

const getAllProductsAdmin = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsAdminFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "All Products retrieved successfully",
    data: result,
  });
});

const getFeaturedProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getFeaturedProductsFromDB(req.query);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Featured Products retrieved successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req, res) => {
  updatedPriceData(req);
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
  getAProductCustomer,
  getAProductAdmin,
  getAllProductsCustomer,
  getAllProductsAdmin,
  getFeaturedProducts,
  updateProduct,
  deleteProduct,
};
