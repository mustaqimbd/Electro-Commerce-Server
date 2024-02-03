import { Schema, model } from "mongoose";
import { permissionEnums } from "./permission.const";
import { TPermission } from "./permission.interface";

const PermissionSchema = new Schema<TPermission>({
  name: {
    type: String,
    enum: permissionEnums,
    required: true,
    unique: true,
  },
});

export const Permission = model<TPermission>("Permission", PermissionSchema);
