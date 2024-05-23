import crypto from "crypto";
import { CookieOptions, NextFunction, Request, Response } from "express";
import { Types } from "mongoose";
import config from "../config/config";

const generateNewId = () => {
  const objId = new Types.ObjectId().toString();
  return objId.slice(10) + crypto.randomBytes(16).toString("base64");
};

// ecSID => Electro commerce session id
export const ecSIDHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let ecSID = req?.cookies["__app.ec.sid"];
  const cookieOption: CookieOptions = {
    domain:
      config.env === "production" ? `.${config.main_domain}` : "localhost",
    httpOnly: config.env === "production",
    secure: config.env === "production",
    sameSite: "lax",
    maxAge: Number(config.session_expires),
  };
  if (!ecSID) {
    ecSID = generateNewId();
    res.cookie("__app.ec.sid", ecSID, cookieOption);
  }

  const ecSIDData = {
    id: ecSID,
    newId: function () {
      const newId = generateNewId();
      res.cookie("__app.ec.sid", newId, cookieOption);
      this.id = newId;
    },
  };
  req.ecSID = ecSIDData;
  next();
};
