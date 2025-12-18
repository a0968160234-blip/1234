
export interface UserProfile {
  uid: string;
  email: string;
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  bankName: string;
  color: string;
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}
