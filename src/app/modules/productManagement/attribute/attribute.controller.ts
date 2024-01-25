import httpStatus from "http-status";
import { AttributeServices } from "./attribute.service";
import catchAsync from "../../../utilities/catchAsync";
import successResponse from "../../../utilities/successResponse";

const createAttribute = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const result = await AttributeServices.createAttributeIntoDB(
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
  const result = await AttributeServices.getAllAttributesFromDB();
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Attributes retrieved successfully",
    data: result,
  });
});

const updateAttribute = catchAsync(async (req, res) => {
  const createdBy = req.user.id;
  const attributeId = req.params.id;
  const result = await AttributeServices.updateAttributeIntoDB(
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
  const createdBy = req.user.id;
  const attributeId = req.params.id;
  await AttributeServices.deleteAttributeFromDB(createdBy, attributeId);
  successResponse(res, {
    statusCode: httpStatus.OK,
    message: "Attribute deleted successfully",
    data: null,
  });
});

export const AttributeControllers = {
  createAttribute,
  getAllAttributes,
  updateAttribute,
  deleteAttribute,
};
