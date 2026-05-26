export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  household_id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "other";
  balance: number;
  institution: string | null;
  external_id: string | null;
  source: "manual" | "simplefin" | "snaptrade";
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  description: string;
  category: string | null;
  date: string;
  created_at: string;
}

export interface Holding {
  id: string;
  account_id: string;
  symbol: string;
  quantity: number;
  cost_basis: number | null;
  current_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface AccountRecord {
  accountId: string;
  displayName: string;
  institutionName?: string;
  source: string;
  balance?: number;
  percentOfNetWorth?: number;
  accountType?: string;
  ownerMemberId?: string;
  connectionLabel?: string;
}
