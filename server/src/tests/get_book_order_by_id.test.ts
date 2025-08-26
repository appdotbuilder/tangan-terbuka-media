import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookOrdersTable, booksTable, bookOrderItemsTable } from '../db/schema';
import { getBookOrderById } from '../handlers/get_book_order_by_id';

describe('getBookOrderById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent order', async () => {
    const result = await getBookOrderById(999);
    expect(result).toBeNull();
  });

  it('should fetch book order by id', async () => {
    // Create test book
    const bookResult = await db.insert(booksTable)
      .values({
        title: 'Test Book',
        author: 'Test Author',
        price: '19.99',
        stock_quantity: 100,
        available: true
      })
      .returning()
      .execute();

    const book = bookResult[0];

    // Create test order
    const orderResult = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        customer_phone: '1234567890',
        customer_address: '123 Test St',
        total_amount: '39.98',
        status: 'pending',
        notes: 'Test order'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    await db.insert(bookOrderItemsTable)
      .values({
        order_id: order.id,
        book_id: book.id,
        quantity: 2,
        price: '19.99'
      })
      .execute();

    // Fetch the order
    const result = await getBookOrderById(order.id);

    // Verify order data
    expect(result).not.toBeNull();
    expect(result!.id).toBe(order.id);
    expect(result!.customer_name).toBe('John Doe');
    expect(result!.customer_email).toBe('john@example.com');
    expect(result!.customer_phone).toBe('1234567890');
    expect(result!.customer_address).toBe('123 Test St');
    expect(result!.total_amount).toBe(39.98);
    expect(typeof result!.total_amount).toBe('number');
    expect(result!.status).toBe('pending');
    expect(result!.notes).toBe('Test order');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle order with different status', async () => {
    // Create test order with different status
    const orderResult = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'Jane Smith',
        customer_email: 'jane@example.com',
        customer_phone: '0987654321',
        customer_address: '456 Main St',
        total_amount: '25.50',
        status: 'completed'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    const result = await getBookOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.status).toBe('completed');
    expect(result!.total_amount).toBe(25.50);
    expect(result!.notes).toBeNull();
  });

  it('should handle order with null optional fields', async () => {
    // Create test order with minimal required fields
    const orderResult = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'Test Customer',
        customer_email: 'test@example.com',
        customer_phone: '1111111111',
        customer_address: '789 Oak Ave',
        total_amount: '100.00',
        status: 'confirmed'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    const result = await getBookOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.notes).toBeNull();
    expect(result!.total_amount).toBe(100.00);
  });

  it('should handle large decimal amounts correctly', async () => {
    // Create test order with precise decimal amount
    const orderResult = await db.insert(bookOrdersTable)
      .values({
        customer_name: 'Decimal Test',
        customer_email: 'decimal@example.com',
        customer_phone: '2222222222',
        customer_address: '321 Pine St',
        total_amount: '1234.56',
        status: 'shipped'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    const result = await getBookOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.total_amount).toBe(1234.56);
    expect(typeof result!.total_amount).toBe('number');
  });
});