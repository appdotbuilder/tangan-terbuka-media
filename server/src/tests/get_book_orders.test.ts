import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookOrdersTable, booksTable, bookOrderItemsTable } from '../db/schema';
import { type GetBookOrdersInput } from '../schema';
import { getBookOrders } from '../handlers/get_book_orders';

describe('getBookOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create test book orders
  const createTestOrders = async () => {
    // Create a test book first
    const testBook = await db.insert(booksTable)
      .values({
        title: 'Test Book',
        author: 'Test Author',
        price: '29.99',
        stock_quantity: 10,
        available: true
      })
      .returning()
      .execute();

    // Create multiple test orders
    const orders = await db.insert(bookOrdersTable)
      .values([
        {
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
          customer_phone: '+1234567890',
          customer_address: '123 Main St',
          total_amount: '59.98',
          status: 'pending'
        },
        {
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
          customer_phone: '+0987654321',
          customer_address: '456 Oak Ave',
          total_amount: '89.97',
          status: 'confirmed'
        },
        {
          customer_name: 'Bob Johnson',
          customer_email: 'bob@example.com',
          customer_phone: '+1122334455',
          customer_address: '789 Pine Rd',
          total_amount: '119.96',
          status: 'shipped'
        }
      ])
      .returning()
      .execute();

    // Create order items for each order
    for (const order of orders) {
      await db.insert(bookOrderItemsTable)
        .values({
          order_id: order.id,
          book_id: testBook[0].id,
          quantity: 2,
          price: (parseFloat(order.total_amount) / 2).toString()
        })
        .execute();
    }

    return orders;
  };

  it('should fetch all book orders without filters', async () => {
    const testOrders = await createTestOrders();
    
    const result = await getBookOrders();

    expect(result).toHaveLength(3);
    
    // Verify numeric conversion
    result.forEach(order => {
      expect(typeof order.total_amount).toBe('number');
      expect(order.total_amount).toBeGreaterThan(0);
    });

    // Verify ordering (newest first)
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
    expect(result[1].created_at.getTime()).toBeGreaterThanOrEqual(result[2].created_at.getTime());

    // Verify basic properties
    expect(result.some(order => order.customer_name === 'John Doe')).toBe(true);
    expect(result.some(order => order.customer_name === 'Jane Smith')).toBe(true);
    expect(result.some(order => order.customer_name === 'Bob Johnson')).toBe(true);
  });

  it('should filter by status', async () => {
    await createTestOrders();

    const input: GetBookOrdersInput = {
      status: 'confirmed'
    };

    const result = await getBookOrders(input);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('confirmed');
    expect(result[0].customer_name).toBe('Jane Smith');
    expect(typeof result[0].total_amount).toBe('number');
    expect(result[0].total_amount).toBe(89.97);
  });

  it('should apply pagination with limit', async () => {
    await createTestOrders();

    const input: GetBookOrdersInput = {
      limit: 2
    };

    const result = await getBookOrders(input);

    expect(result).toHaveLength(2);
    result.forEach(order => {
      expect(typeof order.total_amount).toBe('number');
    });
  });

  it('should apply pagination with offset', async () => {
    await createTestOrders();

    const input: GetBookOrdersInput = {
      limit: 2,
      offset: 1
    };

    const result = await getBookOrders(input);

    expect(result).toHaveLength(2);
    
    // Get all orders to compare
    const allOrders = await getBookOrders();
    
    // Result should be the second and third orders (offset = 1)
    expect(result[0].id).toBe(allOrders[1].id);
    expect(result[1].id).toBe(allOrders[2].id);
  });

  it('should combine status filter with pagination', async () => {
    await createTestOrders();

    // Create additional confirmed orders
    await db.insert(bookOrdersTable)
      .values([
        {
          customer_name: 'Alice Brown',
          customer_email: 'alice@example.com',
          customer_phone: '+5566778899',
          customer_address: '321 Elm St',
          total_amount: '45.99',
          status: 'confirmed'
        },
        {
          customer_name: 'Charlie Wilson',
          customer_email: 'charlie@example.com',
          customer_phone: '+9988776655',
          customer_address: '654 Maple Dr',
          total_amount: '75.50',
          status: 'confirmed'
        }
      ])
      .execute();

    const input: GetBookOrdersInput = {
      status: 'confirmed',
      limit: 2,
      offset: 1
    };

    const result = await getBookOrders(input);

    expect(result).toHaveLength(2);
    result.forEach(order => {
      expect(order.status).toBe('confirmed');
      expect(typeof order.total_amount).toBe('number');
    });
  });

  it('should handle empty results', async () => {
    const input: GetBookOrdersInput = {
      status: 'completed'
    };

    const result = await getBookOrders(input);

    expect(result).toHaveLength(0);
  });

  it('should handle orders with different statuses', async () => {
    // Create orders with all possible statuses
    await db.insert(bookOrdersTable)
      .values([
        {
          customer_name: 'Test User 1',
          customer_email: 'test1@example.com',
          customer_phone: '+1111111111',
          customer_address: 'Address 1',
          total_amount: '10.00',
          status: 'pending'
        },
        {
          customer_name: 'Test User 2',
          customer_email: 'test2@example.com',
          customer_phone: '+2222222222',
          customer_address: 'Address 2',
          total_amount: '20.00',
          status: 'confirmed'
        },
        {
          customer_name: 'Test User 3',
          customer_email: 'test3@example.com',
          customer_phone: '+3333333333',
          customer_address: 'Address 3',
          total_amount: '30.00',
          status: 'shipped'
        },
        {
          customer_name: 'Test User 4',
          customer_email: 'test4@example.com',
          customer_phone: '+4444444444',
          customer_address: 'Address 4',
          total_amount: '40.00',
          status: 'completed'
        },
        {
          customer_name: 'Test User 5',
          customer_email: 'test5@example.com',
          customer_phone: '+5555555555',
          customer_address: 'Address 5',
          total_amount: '50.00',
          status: 'cancelled'
        }
      ])
      .execute();

    // Test each status
    const statuses = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'] as const;
    
    for (const status of statuses) {
      const result = await getBookOrders({ status });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(status);
      expect(typeof result[0].total_amount).toBe('number');
    }
  });

  it('should preserve all order fields', async () => {
    const testOrders = await createTestOrders();
    
    const result = await getBookOrders();

    expect(result).toHaveLength(3);
    
    const order = result[0];
    expect(order.id).toBeDefined();
    expect(order.customer_name).toBeDefined();
    expect(order.customer_email).toBeDefined();
    expect(order.customer_phone).toBeDefined();
    expect(order.customer_address).toBeDefined();
    expect(typeof order.total_amount).toBe('number');
    expect(order.status).toBeDefined();
    expect(order.created_at).toBeInstanceOf(Date);
    expect(order.updated_at).toBeInstanceOf(Date);
  });
});