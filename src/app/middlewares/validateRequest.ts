import { NextFunction, Request, Response } from "express";
import fs from "fs";
import { AnyZodObject, ZodEffects } from "zod";

const validateRequest =
  (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
        cookies: req.cookies,
      });
      return next();
    } catch (error) {
      if (req.files) {
        Object.values(req.files).forEach((files) => {
          files.forEach((file: Record<string, unknown>) => {
            const filePath = file.path;
            //delete the file from uploads if error occurs
            fs.unlink(filePath as string, (err) => {
              if (err) {
                return next(err);
              }
            });
          });
        });
      }

      next(error);
    }
  };
export default validateRequest;
