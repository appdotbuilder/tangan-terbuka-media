import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookOrdersTable } from '../db/schema';
import { type UpdateBookOrderStatusInput } from '../schema';
import { updateBookOrderStatus } from '../handlers/update_book_order_status';
import { eq } from 'drizzle-orm';

describe('updateBookOrderStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test order
  const createTestOrder = async () => {
    const result = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '1234567890',
        customer_address: '123 Main St',
        total_amount: '99.99',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should update order status successfully', async () => {
    const order = await createTestOrder();
    
    const input: UpdateBookOrderStatusInput = {
      id: order.id,
      status: 'confirmed'
    };

    const result = await updateBookOrderStatus(input);

    // Verify the returned data
    expect(result.id).toBe(order.id);
    expect(result.status).toBe('confirmed');
    expect(result.customer_name).toBe('John Doe');
    expect(result.customer_email).toBe('john@example.com');
    expect(result.total_amount).toBe(99.99);
    expect(typeof result.total_amount).toBe('number');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > order.updated_at).toBe(true);
  });

  it('should save updated status to database', async () => {
    const order = await createTestOrder();
    
    const input: UpdateBookOrderStatusInput = {
      id: order.id,
      status: 'shipped'
    };

    await updateBookOrderStatus(input);

    // Query the database to verify the update
    const updatedOrders = await db.select()
      .from(bookOrdersTable)
      .where(eq(bookOrdersTable.id, order.id))
      .execute();

    expect(updatedOrders).toHaveLength(1);
    expect(updatedOrders[0].status).toBe('shipped');
    expect(updatedOrders[0].updated_at > order.updated_at).toBe(true);
  });

  it('should update to all valid status values', async () => {
    const order = await createTestOrder();
    const statusValues = ['pending', 'confirmed', 'shipped', 'completed', 'cancelled'] as const;

    for (const status of statusValues) {
      const input: UpdateBookOrderStatusInput = {
        id: order.id,
        status: status
      };

      const result = await updateBookOrderStatus(input);
      expect(result.status).toBe(status);

      // Verify in database
      const dbOrders = await db.select()
        .from(bookOrdersTable)
        .where(eq(bookOrdersTable.id, order.id))
        .execute();
      
      expect(dbOrders[0].status).toBe(status);
    }
  });

  it('should preserve all other order fields', async () => {
    const order = await createTestOrder();
    
    const input: UpdateBookOrderStatusInput = {
      id: order.id,
      status: 'completed'
    };

    const result = await updateBookOrderStatus(input);

    // Verify all original fields are preserved
    expect(result.customer_name).toBe(order.customer_name);
    expect(result.customer_email).toBe(order.customer_email);
    expect(result.customer_phone).toBe(order.customer_phone);
    expect(result.customer_address).toBe(order.customer_address);
    expect(result.total_amount).toBe(parseFloat(order.total_amount));
    expect(result.notes).toBe(order.notes);
    expect(result.created_at).toEqual(order.created_at);
  });

  it('should throw error for non-existent order', async () => {
    const input: UpdateBookOrderStatusInput = {
      id: 99999,
      status: 'confirmed'
    };

    await expect(updateBookOrderStatus(input)).rejects.toThrow(/Book order with id 99999 not found/);
  });

  it('should handle orders with null notes', async () => {
    // Create order with null notes
    const result = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'Jane Doe',
        customer_email: 'jane@example.com',
        customer_phone: '0987654321',
        customer_address: '456 Oak Ave',
        total_amount: '149.99',
        status: 'pending',
        notes: null
      })
      .returning()
      .execute();
    
    const order = result[0];

    const input: UpdateBookOrderStatusInput = {
      id: order.id,
      status: 'confirmed'
    };

    const updatedOrder = await updateBookOrderStatus(input);

    expect(updatedOrder.notes).toBe(null);
    expect(updatedOrder.status).toBe('confirmed');
  });

  it('should handle orders with large amounts', async () => {
    // Create order with large amount
    const result = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'Big Spender',
        customer_email: 'big@example.com',
        customer_phone: '5555555555',
        customer_address: '789 Rich St',
        total_amount: '9999.99',
        status: 'pending',
        notes: 'Large order'
      })
      .returning()
      .execute();
    
    const order = result[0];

    const input: UpdateBookOrderStatusInput = {
      id: order.id,
      status: 'confirmed'
    };

    const updatedOrder = await updateBookOrderStatus(input);

    expect(updatedOrder.total_amount).toBe(9999.99);
    expect(typeof updatedOrder.total_amount).toBe('number');
    expect(updatedOrder.status).toBe('confirmed');
  });
});