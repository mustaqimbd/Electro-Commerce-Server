import { RequestHandler } from "express";

type UploadedFiles = {
  // eslint-disable-next-line no-undef
  [fieldname: string]: Express.Multer.File[];
};

const formDataParse: RequestHandler = (req, res, next) => {
  try {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }

    if (req.files) {
      const { thumbnail, gallery } = req.files as UploadedFiles;
      let thumImg, galleryImg;
      if (Array.isArray(thumbnail)) {
        thumImg = thumbnail.map(({ path, originalname }) => ({
          src: path,
          alt: originalname,
        }))[0];
      }

      if (Array.isArray(gallery)) {
        galleryImg = gallery.map(({ path, originalname }) => ({
          src: path,
          alt: originalname,
        }));
      }
      req.body.image = { thumbnail: thumImg, gallery: galleryImg };
    }
  } catch (error) {
    return next(error); // Return early if an error occurs
  }
  next(); // Call next() to proceed to the next middleware
};

export default formDataParse;
