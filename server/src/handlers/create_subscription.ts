import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput, type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export const createSubscription = async (input: CreateSubscriptionInput): Promise<Subscription> => {
  try {
    // Check if email already exists
    const existingSubscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.email, input.email))
      .execute();

    if (existingSubscriptions.length > 0) {
      const existing = existingSubscriptions[0];
      
      if (existing.active) {
        // Already active subscription, return as is
        return {
          ...existing,
          subscribed_at: existing.subscribed_at,
          unsubscribed_at: existing.unsubscribed_at
        };
      } else {
        // Reactivate existing subscription
        const reactivated = await db.update(subscriptionsTable)
          .set({
            active: true,
            name: input.name || existing.name, // Update name if provided
            subscribed_at: new Date(),
            unsubscribed_at: null
          })
          .where(eq(subscriptionsTable.id, existing.id))
          .returning()
          .execute();

        return {
          ...reactivated[0],
          subscribed_at: reactivated[0].subscribed_at,
          unsubscribed_at: reactivated[0].unsubscribed_at
        };
      }
    }

    // Create new subscription
    const result = await db.insert(subscriptionsTable)
      .values({
        email: input.email,
        name: input.name || null,
        active: true
      })
      .returning()
      .execute();

    return {
      ...result[0],
      subscribed_at: result[0].subscribed_at,
      unsubscribed_at: result[0].unsubscribed_at
    };
  } catch (error) {
    console.error('Subscription creation failed:', error);
    throw error;
  }
};