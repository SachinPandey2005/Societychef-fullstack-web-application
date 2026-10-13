import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '../db/client';
import { disputeCases, disputeComments, profiles, kitchens } from '../db/schema';
import { rowToSnakeCase, toCamelCaseInput } from '../db/caseMapper';
import { DisputeCase, DisputeComment } from '../types/refund';

// Unlike most other files converted this session, dispute_cases and
// dispute_comments are real tables with real FKs to profiles/kitchens — no
// missing schema here. The fake-data fallbacks (createDispute,
// updateDispute, getDisputes, addComment all silently return mock data on
// any error, and getDisputes returns 2 hardcoded disputes on a genuinely
// empty table) are preserved exactly as before, same as the
// DishRepository/SettingsRepository precedent — not this conversion's call
// to remove. Embedded joins (profiles!customer_id, kitchens!kitchen_id)
// replaced with explicit Drizzle leftJoins since there's no equivalent
// shorthand.
export class DisputeRepository {
  static async createDispute(payload: Partial<DisputeCase>): Promise<DisputeCase> {
    const code = `DISP-${Date.now().toString().slice(-6)}`;
    const record = {
      disputeCode: code,
      orderId: payload.order_id,
      customerId: payload.customer_id,
      kitchenId: payload.kitchen_id,
      category: payload.category || 'INCORRECT_CHARGE',
      status: payload.status || 'PENDING',
      priority: payload.priority || 'MEDIUM',
      assignedAgentId: payload.assigned_agent_id,
      description: payload.description || 'Customer raised a dispute',
      resolutionNotes: payload.resolution_notes,
    };

    try {
      const rows = await db.insert(disputeCases).values(record).returning();
      return rowToSnakeCase<DisputeCase>(rows[0]);
    } catch (error: any) {
      console.warn('Falling back from dispute_cases insert:', error.message);
      return {
        id: `disp_${Date.now()}`,
        dispute_code: record.disputeCode,
        order_id: record.orderId,
        customer_id: record.customerId,
        kitchen_id: record.kitchenId,
        category: record.category,
        status: record.status,
        priority: record.priority,
        assigned_agent_id: record.assignedAgentId,
        description: record.description,
        resolution_notes: record.resolutionNotes,
        created_at: new Date().toISOString(),
      } as DisputeCase;
    }
  }

  static async findById(id: string): Promise<DisputeCase | null> {
    const rows = await db
      .select({ dispute: disputeCases, profile: profiles, kitchen: kitchens })
      .from(disputeCases)
      .leftJoin(profiles, eq(disputeCases.customerId, profiles.id))
      .leftJoin(kitchens, eq(disputeCases.kitchenId, kitchens.id))
      .where(eq(disputeCases.id, id))
      .limit(1);

    if (!rows[0]) return null;
    const { dispute, profile, kitchen } = rows[0];

    return {
      ...rowToSnakeCase<any>(dispute),
      customer_name: profile?.displayName || 'Customer',
      kitchen_name: kitchen?.name || 'Kitchen',
      chef_name: kitchen?.chefName || 'Chef',
    } as DisputeCase;
  }

  static async updateDispute(id: string, updates: Partial<DisputeCase>): Promise<DisputeCase> {
    const payload: any = {
      ...(toCamelCaseInput(updates) as any),
      updatedAt: new Date().toISOString(),
    };

    if (updates.status === 'RESOLVED' || updates.status === 'REJECTED') {
      payload.resolvedAt = new Date().toISOString();
    }

    try {
      const rows = await db.update(disputeCases).set(payload).where(eq(disputeCases.id, id)).returning();
      return rowToSnakeCase<DisputeCase>(rows[0]);
    } catch (error) {
      return {
        id,
        dispute_code: `DISP-${id.slice(-6)}`,
        order_id: 'ord_mock',
        category: updates.category || 'INCORRECT_CHARGE',
        status: updates.status || 'INVESTIGATING',
        priority: updates.priority || 'MEDIUM',
        description: updates.description || 'Updated dispute',
        resolution_notes: updates.resolution_notes,
        updated_at: new Date().toISOString(),
      } as DisputeCase;
    }
  }

  static async getDisputes(limit = 50, offset = 0, filters?: any): Promise<DisputeCase[]> {
    const conditions = [];
    if (filters?.status && filters.status !== 'all') conditions.push(eq(disputeCases.status, filters.status.toUpperCase()));
    if (filters?.category && filters.category !== 'all') conditions.push(eq(disputeCases.category, filters.category.toUpperCase()));
    if (filters?.priority && filters.priority !== 'all') conditions.push(eq(disputeCases.priority, filters.priority.toUpperCase()));

    const rows = await db
      .select({ dispute: disputeCases, profile: profiles, kitchen: kitchens })
      .from(disputeCases)
      .leftJoin(profiles, eq(disputeCases.customerId, profiles.id))
      .leftJoin(kitchens, eq(disputeCases.kitchenId, kitchens.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(disputeCases.createdAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      // Return initial mock disputes if table empty
      return [
        {
          id: 'disp_101',
          dispute_code: 'DISP-990101',
          order_id: 'ord_9901',
          category: 'INCORRECT_CHARGE',
          status: 'INVESTIGATING',
          priority: 'HIGH',
          description: 'Customer claims delivery fee was charged twice on app checkout.',
          customer_name: 'Rahul Sharma',
          chef_name: 'Chef Ananya',
          kitchen_name: 'Ananya Kitchens',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'disp_102',
          dispute_code: 'DISP-990102',
          order_id: 'ord_9902',
          category: 'MISSING_REFUND',
          status: 'RESOLVED',
          priority: 'MEDIUM',
          description: 'Chef reported wallet deduction did not match settlement credit.',
          resolution_notes: 'Verified commission rule update; discrepancy resolved.',
          customer_name: 'Priya Verma',
          chef_name: 'Chef Suresh',
          kitchen_name: 'Suresh Home Foods',
          resolved_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ] as unknown as DisputeCase[];
    }

    return rows.map(({ dispute, profile, kitchen }) => ({
      ...rowToSnakeCase<any>(dispute),
      customer_name: profile?.displayName || 'Customer',
      kitchen_name: kitchen?.name || 'Kitchen',
      chef_name: kitchen?.chefName || 'Chef',
    })) as DisputeCase[];
  }

  static async addComment(comment: Partial<DisputeComment>): Promise<DisputeComment> {
    try {
      const rows = await db
        .insert(disputeComments)
        .values({
          disputeId: comment.dispute_id!,
          authorId: comment.author_id,
          authorRole: comment.author_role,
          comment: comment.comment!,
          isInternal: comment.is_internal,
        })
        .returning();
      return rowToSnakeCase<DisputeComment>(rows[0]);
    } catch (error) {
      return {
        id: `cm_${Date.now()}`,
        dispute_id: comment.dispute_id || '',
        comment: comment.comment || '',
        created_at: new Date().toISOString(),
      } as DisputeComment;
    }
  }

  static async getComments(dispute_id: string): Promise<DisputeComment[]> {
    try {
      const rows = await db.select().from(disputeComments).where(eq(disputeComments.disputeId, dispute_id)).orderBy(asc(disputeComments.createdAt));
      return rows.map((r) => rowToSnakeCase<DisputeComment>(r));
    } catch (e) {
      return [];
    }
  }
}
