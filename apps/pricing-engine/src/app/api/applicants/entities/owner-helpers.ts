import { encryptToHex } from "@/lib/crypto"

type RawOwner = Record<string, any>

function getBorrowerId(o: RawOwner): string | null {
  const id =
    typeof o?.borrower_id === "string" && o.borrower_id.trim().length > 0
      ? o.borrower_id
      : typeof o?.borrowerId === "string" && o.borrowerId.trim().length > 0
        ? o.borrowerId
        : null
  return id
}

function getEntityOwnerId(o: RawOwner): string | null {
  const id =
    typeof o?.entity_owner_id === "string" && o.entity_owner_id.trim().length > 0
      ? o.entity_owner_id
      : typeof o?.entityOwnerId === "string" && o.entityOwnerId.trim().length > 0
        ? o.entityOwnerId
        : null
  return id
}

function digits(input: unknown): string {
  return typeof input === "string" ? input.replace(/\D+/g, "") : ""
}

export function buildOwnerRows({
  source,
  entityId,
  orgUuid,
}: {
  source: RawOwner[]
  entityId: string
  orgUuid: string
}) {
  return source.map((o: RawOwner) => {
    const borrowerId = getBorrowerId(o)
    const entityOwnerId = getEntityOwnerId(o)
    const memberType = typeof o?.member_type === "string" ? o.member_type.trim() : ""
    const ssnDigits = digits(o?.ssn)
    const existingSsnEncrypted = (o as any)?.ssn_encrypted ?? (o as any)?.ssnEncrypted ?? null
    const existingSsnLast4 = (o as any)?.ssn_last4 ?? (o as any)?.ssnLast4 ?? null
    const einDigits = digits(o?.ein)
    const existingEin = (o as any)?.ein ?? null

    return {
      entity_id: entityId,
      name: o?.name || null,
      title: o?.title || null,
      member_type: memberType || null,
      ssn_encrypted:
        memberType === "Individual"
          ? ssnDigits.length === 9
            ? encryptToHex(ssnDigits)
            : existingSsnEncrypted || null
          : null,
      ssn_last4:
        memberType === "Individual"
          ? ssnDigits.length >= 4
            ? ssnDigits.slice(-4)
            : (typeof existingSsnLast4 === "string" ? existingSsnLast4 : null)
          : null,
      ein: memberType === "Entity" ? (einDigits.length > 0 ? einDigits : (existingEin as string | null) || null) : null,
      ownership_percent: typeof o?.ownership_percent === "number" ? o.ownership_percent : null,
      address: o?.address || null,
      borrower_id: borrowerId,
      entity_owner_id: entityOwnerId,
      organization_id: orgUuid,
    }
  })
}
