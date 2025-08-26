import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { type CreateSubscriptionInput } from '../schema';
import { createSubscription } from '../handlers/create_subscription';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateSubscriptionInput = {
  email: 'test@example.com',
  name: 'Test User'
};

const testInputWithoutName: CreateSubscriptionInput = {
  email: 'noname@example.com',
  name: null
};

describe('createSubscription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a new subscription', async () => {
    const result = await createSubscription(testInput);

    expect(result.email).toEqual('test@example.com');
    expect(result.name).toEqual('Test User');
    expect(result.active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.subscribed_at).toBeInstanceOf(Date);
    expect(result.unsubscribed_at).toBeNull();
  });

  it('should create subscription without name', async () => {
    const result = await createSubscription(testInputWithoutName);

    expect(result.email).toEqual('noname@example.com');
    expect(result.name).toBeNull();
    expect(result.active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.subscribed_at).toBeInstanceOf(Date);
    expect(result.unsubscribed_at).toBeNull();
  });

  it('should save subscription to database', async () => {
    const result = await createSubscription(testInput);

    const subscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, result.id))
      .execute();

    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0].email).toEqual('test@example.com');
    expect(subscriptions[0].name).toEqual('Test User');
    expect(subscriptions[0].active).toEqual(true);
    expect(subscriptions[0].subscribed_at).toBeInstanceOf(Date);
    expect(subscriptions[0].unsubscribed_at).toBeNull();
  });

  it('should return existing active subscription when email already exists', async () => {
    // Create initial subscription
    const first = await createSubscription(testInput);

    // Try to create again with same email
    const second = await createSubscription({
      email: 'test@example.com',
      name: 'Different Name'
    });

    // Should return the same subscription (same ID)
    expect(second.id).toEqual(first.id);
    expect(second.email).toEqual(first.email);
    expect(second.name).toEqual(first.name); // Should keep original name
    expect(second.active).toEqual(true);

    // Verify only one record exists in database
    const allSubscriptions = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.email, 'test@example.com'))
      .execute();

    expect(allSubscriptions).toHaveLength(1);
  });

  it('should reactivate inactive subscription when email already exists', async () => {
    // Create initial subscription
    const initial = await createSubscription(testInput);

    // Manually deactivate it
    await db.update(subscriptionsTable)
      .set({
        active: false,
        unsubscribed_at: new Date()
      })
      .where(eq(subscriptionsTable.id, initial.id))
      .execute();

    // Try to create again with same email but different name
    const reactivated = await createSubscription({
      email: 'test@example.com',
      name: 'Updated Name'
    });

    // Should reactivate and update name
    expect(reactivated.id).toEqual(initial.id);
    expect(reactivated.email).toEqual('test@example.com');
    expect(reactivated.name).toEqual('Updated Name');
    expect(reactivated.active).toEqual(true);
    expect(reactivated.subscribed_at).toBeInstanceOf(Date);
    expect(reactivated.unsubscribed_at).toBeNull();

    // Verify in database
    const dbSubscription = await db.select()
      .from(subscriptionsTable)
      .where(eq(subscriptionsTable.id, initial.id))
      .execute();

    expect(dbSubscription[0].active).toEqual(true);
    expect(dbSubscription[0].name).toEqual('Updated Name');
    expect(dbSubscription[0].unsubscribed_at).toBeNull();
  });

  it('should preserve existing name when reactivating with null name', async () => {
    // Create initial subscription with name
    const initial = await createSubscription(testInput);

    // Manually deactivate it
    await db.update(subscriptionsTable)
      .set({
        active: false,
        unsubscribed_at: new Date()
      })
      .where(eq(subscriptionsTable.id, initial.id))
      .execute();

    // Try to reactivate with null name
    const reactivated = await createSubscription({
      email: 'test@example.com',
      name: null
    });

    // Should preserve original name
    expect(reactivated.id).toEqual(initial.id);
    expect(reactivated.name).toEqual('Test User'); // Original name preserved
    expect(reactivated.active).toEqual(true);
  });

  it('should handle email uniqueness constraint', async () => {
    const result = await createSubscription(testInput);

    // Verify subscription was created
    expect(result.email).toEqual('test@example.com');
    expect(result.active).toEqual(true);

    // Try creating another subscription with same email should return existing
    const duplicate = await createSubscription(testInput);
    expect(duplicate.id).toEqual(result.id);
  });
});