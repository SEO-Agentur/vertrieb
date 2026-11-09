import { db } from "./db";

export async function audit(params: {
  tenantId: string;
  actorType: "USER" | "VISITOR" | "SYSTEM";
  actorId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      tenantId: params.tenantId,
      actorType: params.actorType,
      actorId: params.actorId ?? null,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      meta: (params.meta ?? undefined) as object | undefined,
    },
  });
}

export async function logActivity(params: {
  tenantId: string;
  companyId?: string | null;
  userId?: string | null;
  type: string;
  title: string;
  body?: string | null;
  meta?: Record<string, unknown>;
}) {
  return db.activity.create({
    data: {
      tenantId: params.tenantId,
      companyId: params.companyId ?? null,
      userId: params.userId ?? null,
      type: params.type,
      title: params.title,
      body: params.body ?? null,
      meta: (params.meta ?? undefined) as object | undefined,
    },
  });
}

export async function notify(params: { tenantId: string; userId?: string | null; type: string; title: string; body?: string; link?: string }) {
  return db.notification.create({ data: { ...params, userId: params.userId ?? null } });
}
