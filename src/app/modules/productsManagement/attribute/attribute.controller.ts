import httpStatus from "http-status";
import { attributeServices } from "./attribute.service";
import catchAsync from "../../../shared/catchAsync";
import successResponse from "../../../shared/successResponse";

const createAttribute = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const result = await attributeServices.createAttributeIntoDB(
    createdBy,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Attribute created successfully",
    data: result,
  });
});

const getAllAttributes = catchAsync(async (req, res) => {
  const result = await attributeServices.getAllAttributesFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Attributes retrieved successfully",
    data: result,
  });
});

const updateAttribute = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const attributeId = req.params.id;
  const result = await attributeServices.updateAttributeIntoDB(
    createdBy,
    attributeId,
    req.body
  );
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Attribute updated successfully",
    data: result,
  });
});

const deleteAttribute = catchAsync(async (req, res) => {
  const createdBy = req.user._id;
  const attributeId = req.params.id;
  await attributeServices.deleteAttributeIntoDB(createdBy, attributeId);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Attribute deleted successfully",
    data: null,
  });
});

export const attributeControllers = {
  createAttribute,
  getAllAttributes,
  updateAttribute,
  deleteAttribute,
};
