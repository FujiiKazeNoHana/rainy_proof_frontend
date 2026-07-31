export type AuthProfile = {
  name: string;
  roles: string[];
  description: string;
};

export type DevTokenRequest = {
  subject?: string;
  displayName?: string;
  roles?: string[];
};

export type DevTokenResponse = {
  access_token: string;
  token_type: string;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  tokenType: string;
  roles: string[];
  displayName: string;
  subject: string;
};
