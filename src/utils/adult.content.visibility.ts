import type { ObjectLiteral, SelectQueryBuilder } from "typeorm";
import type { Request } from "express";

export function canShowAdultContent(user?: Request["user"] | null) {
  return user?.showAdultContent === true;
}

export function applyAdultContentFilter<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  allowAdultContent: boolean,
  alias = "novel",
) {
  if (!allowAdultContent) {
    query.andWhere(`${alias}."isAdultContent" = false`);
  }

  return query;
}
