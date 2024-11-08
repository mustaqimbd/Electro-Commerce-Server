import { NextFunction, Request, Response } from "express";

/**
 * This function sets the Cross-Origin-Resource-Policy header to "cross-origin" in the response.
 * @param {Request} req - Request object containing information about the HTTP request
 * @param {Response} res - The `res` parameter in the function `enableCrossOriginResourcePolicy`
 * represents the response object in Express.js. It is used to send a response back to the client
 * making the request. In this case, the function is setting the "Cross-Origin-Resource-Policy" header
 * on the response to
 * @param {NextFunction} next - The `next` parameter in the function `enableCrossOriginResourcePolicy`
 * is a callback function that is used to pass control to the next middleware function in the stack.
 * When called, it will execute the next middleware function in the chain. This is commonly used in
 * Express.js middleware functions to move to
 */
const enableCrossOriginResourcePolicy = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
};

export default enableCrossOriginResourcePolicy;
