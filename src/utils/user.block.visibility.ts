import { ObjectLiteral, SelectQueryBuilder } from "typeorm";

export function applyBlockedUserVisibilityFilter<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  viewerId: string | undefined,
  ownerAlias: string,
) {
  if (!viewerId) return query;

  const ownerId = `"${ownerAlias}"."id"`;

  return query.andWhere(
    `NOT EXISTS (
      SELECT 1
      FROM "user_block" "block"
      WHERE
        ("block"."blockerId" = :viewerId AND "block"."blockedId" = ${ownerId})
        OR
        ("block"."blockerId" = ${ownerId} AND "block"."blockedId" = :viewerId)
    )`,
    { viewerId },
  );
}
