export type Account = {
  id: string;
  site: string;
  username: string;
  password: string;
  createdAt: string;
};

export type VaultData = {
  accounts: Account[];
};
