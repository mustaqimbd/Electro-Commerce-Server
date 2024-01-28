export type TImage = {
  src: string;
  alt?: string;
};

export type TProductImage = {
  thumbnail: TImage;
  gallery: TImage[];
};
