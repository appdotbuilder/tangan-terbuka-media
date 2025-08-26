import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { unsubscribeEmail } from '../handlers/unsubscribe_email';
import { eq } from 'drizzle-orm';

describe('unsubscribeEmail', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should unsubscribe an active subscription', async () => {
    // Create an active subscription first
    const createResult = await db.insert(subscriptionsTable)
      .values({
        email: 'test@example.com',
        name: 'Test User',
        active: true
      })
      .returning()
      .execute();

    const subscription = createResult[0];

    // Unsubscribe the email
    const result = await unsubscribeEmail('test@example.com');

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.email).toEqual('test@example.com');
    expect(result!.name).toEqual('Test User');
    expect(result!.active).toEqual(false);
    expect(result!.unsubscribed_at).toBeInstanceOf(Date);
    expect(result!.id).toEqual(subscription.id);
    expect(result!.subscribed_at).toBeInstanceOf(Date);
  });

  it('should update database record correctly', async () => {
    // Create an active subscription
    await db.insert(subscriptionsTable)
      .values({
        email: 'database@example.com',
        name: 'Database User',
        active: true
      })
      .returning()
      .execute();

    // Unsubscribe the email
    const result = await unsubscribeEmail('database@example.com');

    // Query the database directly to verify changes
    const dbRecord = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.email, 'database@example.com'))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].active).toEqual(false);
    expect(dbRecord[0].unsubscribed_at).toBeInstanceOf(Date);
    expect(dbRecord[0].name).toEqual('Database User');
    
    // Verify the unsubscribed_at timestamp is recent (within last minute)
    const now = new Date();
    const timeDiff = now.getTime() - dbRecord[0].unsubscribed_at!.getTime();
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });

  it('should return null for non-existent email', async () => {
    // Try to unsubscribe an email that doesn't exist
    const result = await unsubscribeEmail('nonexistent@example.com');

    expect(result).toBeNull();
  });

  it('should handle already unsubscribed email', async () => {
    // Create an already unsubscribed subscription
    const pastDate = new Date('2023-01-01T00:00:00Z');
    await db.insert(subscriptionsTable)
      .values({
        email: 'already@example.com',
        name: 'Already Unsubscribed',
        active: false,
        unsubscribed_at: pastDate
      })
      .returning()
      .execute();

    // Unsubscribe the already unsubscribed email
    const result = await unsubscribeEmail('already@example.com');

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('already@example.com');
    expect(result!.active).toEqual(false);
    expect(result!.unsubscribed_at).toBeInstanceOf(Date);
    
    // Verify that unsubscribed_at was updated to a new timestamp
    expect(result!.unsubscribed_at!.getTime()).toBeGreaterThan(pastDate.getTime());
  });

  it('should handle subscription without name', async () => {
    // Create subscription without name (nullable field)
    await db.insert(subscriptionsTable)
      .values({
        email: 'noname@example.com',
        name: null,
        active: true
      })
      .returning()
      .execute();

    // Unsubscribe the email
    const result = await unsubscribeEmail('noname@example.com');

    expect(result).not.toBeNull();
    expect(result!.email).toEqual('noname@example.com');
    expect(result!.name).toBeNull();
    expect(result!.active).toEqual(false);
    expect(result!.unsubscribed_at).toBeInstanceOf(Date);
  });

  it('should handle case sensitive emails correctly', async () => {
    // Create subscription with lowercase email
    await db.insert(subscriptionsTable)
      .values({
        email: 'case@example.com',
        name: 'Case Test',
        active: true
      })
      .returning()
      .execute();

    // Try to unsubscribe with different case
    const result = await unsubscribeEmail('CASE@example.com');

    // Should return null as emails are case sensitive in the database
    expect(result).toBeNull();

    // Verify original subscription is still active
    const dbRecord = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.email, 'case@example.com'))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].active).toEqual(true);
    expect(dbRecord[0].unsubscribed_at).toBeNull();
  });
});