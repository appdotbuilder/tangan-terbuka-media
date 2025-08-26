import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type Subscription } from '../schema';
import { eq } from 'drizzle-orm';

export async function unsubscribeEmail(email: string): Promise<Subscription | null> {
  try {
    // Update the subscription to set active to false and unsubscribed_at timestamp
    const result = await db.update(subscriptionsTable)
      .set({
        active: false,
        unsubscribed_at: new Date()
      })
      .where(eq(subscriptionsTable.email, email))
      .returning()
      .execute();

    // Return null if no subscription was found for the email
    if (result.length === 0) {
      return null;
    }

    // Return the updated subscription record
    return result[0];
  } catch (error) {
    console.error('Email unsubscribe failed:', error);
    throw error;
  }
}