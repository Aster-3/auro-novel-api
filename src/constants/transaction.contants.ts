import { en } from "@faker-js/faker";

export enum ReaderTransactionType {
  DEPOSIT = "deposit",
  PURCHASE = "purchase",
}

export enum AuthorTransactionType {
  WITHDRAWAL = "withdrawal",
  EARNING = "earning",
  BONUS = "bonus",
}

export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

export enum CoinType {
  MOON = "moonCoins",
  SUN = "sunCoins",
}

export enum Currency {
  TRY = "TRY",
  USD = "USD",
}
