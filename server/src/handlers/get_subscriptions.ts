import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export const getSubscriptions = async (activeOnly: boolean = true): Promise<Subscription[]> => {
  try {
    // Build query with conditional where clause
    const results = activeOnly
      ? await db.select()
          .from(subscriptionsTable)
          .where(eq(subscriptionsTable.active, true))
          .execute()
      : await db.select()
          .from(subscriptionsTable)
          .execute();

    // Return results - no numeric conversions needed for subscriptions table
    return results;
  } catch (error) {
    console.error('Get subscriptions failed:', error);
    throw error;
  }
};