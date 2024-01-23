export type TLogin = {
  phoneNumber: string;
  password: string;
};

export type TLoginResponse = {
  accessToken: string;
  refreshToken?: string;
};

export type TJwtPayload = {
  id: string;
  role: string;
};

export type TRefreshTokenResponse = {
  accessToken: string;
};
