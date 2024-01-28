export type TPrice = {
  regularPrice: number;
  salePrice?: number;
  discount?: number;
  date?: {
    start: string;
    end: string;
  };
};
