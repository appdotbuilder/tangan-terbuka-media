import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { subscriptionsTable } from '../db/schema';
import { getSubscriptions } from '../handlers/get_subscriptions';

describe('getSubscriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no subscriptions exist', async () => {
    const result = await getSubscriptions();
    expect(result).toEqual([]);
  });

  it('should return only active subscriptions by default', async () => {
    // Create test subscriptions - both active and inactive
    await db.insert(subscriptionsTable).values([
      {
        email: 'active@example.com',
        name: 'Active User',
        active: true
      },
      {
        email: 'inactive@example.com',
        name: 'Inactive User',
        active: false
      },
      {
        email: 'active2@example.com',
        name: 'Active User 2',
        active: true
      }
    ]).execute();

    const result = await getSubscriptions();

    expect(result).toHaveLength(2);
    expect(result.every(sub => sub.active === true)).toBe(true);
    expect(result.map(sub => sub.email)).toContain('active@example.com');
    expect(result.map(sub => sub.email)).toContain('active2@example.com');
    expect(result.map(sub => sub.email)).not.toContain('inactive@example.com');
  });

  it('should return all subscriptions when activeOnly is false', async () => {
    // Create test subscriptions - both active and inactive
    await db.insert(subscriptionsTable).values([
      {
        email: 'active@example.com',
        name: 'Active User',
        active: true
      },
      {
        email: 'inactive@example.com',
        name: 'Inactive User',
        active: false
      },
      {
        email: 'inactive2@example.com',
        name: null, // Test nullable name
        active: false
      }
    ]).execute();

    const result = await getSubscriptions(false);

    expect(result).toHaveLength(3);
    expect(result.map(sub => sub.email)).toContain('active@example.com');
    expect(result.map(sub => sub.email)).toContain('inactive@example.com');
    expect(result.map(sub => sub.email)).toContain('inactive2@example.com');
    
    // Verify we have both active and inactive
    const activeCount = result.filter(sub => sub.active).length;
    const inactiveCount = result.filter(sub => !sub.active).length;
    expect(activeCount).toBe(1);
    expect(inactiveCount).toBe(2);
  });

  it('should return subscriptions with correct structure', async () => {
    await db.insert(subscriptionsTable).values({
      email: 'test@example.com',
      name: 'Test User',
      active: true
    }).execute();

    const result = await getSubscriptions();

    expect(result).toHaveLength(1);
    const subscription = result[0];
    
    expect(subscription.id).toBeDefined();
    expect(typeof subscription.id).toBe('number');
    expect(subscription.email).toBe('test@example.com');
    expect(subscription.name).toBe('Test User');
    expect(subscription.active).toBe(true);
    expect(subscription.subscribed_at).toBeInstanceOf(Date);
    expect(subscription.unsubscribed_at).toBeNull();
  });

  it('should handle subscriptions with null names', async () => {
    await db.insert(subscriptionsTable).values([
      {
        email: 'with-name@example.com',
        name: 'User With Name',
        active: true
      },
      {
        email: 'no-name@example.com',
        name: null,
        active: true
      }
    ]).execute();

    const result = await getSubscriptions();

    expect(result).toHaveLength(2);
    
    const withName = result.find(sub => sub.email === 'with-name@example.com');
    const withoutName = result.find(sub => sub.email === 'no-name@example.com');
    
    expect(withName?.name).toBe('User With Name');
    expect(withoutName?.name).toBeNull();
  });

  it('should handle unsubscribed_at dates correctly', async () => {
    const unsubscribeDate = new Date('2024-01-15T10:30:00Z');
    
    await db.insert(subscriptionsTable).values([
      {
        email: 'active@example.com',
        name: 'Active User',
        active: true,
        unsubscribed_at: null
      },
      {
        email: 'unsubscribed@example.com',
        name: 'Unsubscribed User',
        active: false,
        unsubscribed_at: unsubscribeDate
      }
    ]).execute();

    const result = await getSubscriptions(false);

    expect(result).toHaveLength(2);
    
    const activeUser = result.find(sub => sub.email === 'active@example.com');
    const unsubscribedUser = result.find(sub => sub.email === 'unsubscribed@example.com');
    
    expect(activeUser?.unsubscribed_at).toBeNull();
    expect(unsubscribedUser?.unsubscribed_at).toBeInstanceOf(Date);
    expect(unsubscribedUser?.unsubscribed_at?.getTime()).toBe(unsubscribeDate.getTime());
  });
});