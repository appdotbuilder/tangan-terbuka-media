import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { bookOrdersTable, bookOrderItemsTable, booksTable } from '../db/schema';
import { type CreateBookOrderInput } from '../schema';
import { createBookOrder } from '../handlers/create_book_order';
import { eq } from 'drizzle-orm';

describe('createBookOrder', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test books before each test that needs them
  const createTestBooks = async () => {
    const booksData = [
      {
        title: 'Test Book 1',
        author: 'Test Author 1',
        price: '19.99',
        stock_quantity: 10,
        available: true
      },
      {
        title: 'Test Book 2',
        author: 'Test Author 2',
        price: '29.99',
        stock_quantity: 5,
        available: true
      },
      {
        title: 'Unavailable Book',
        author: 'Test Author 3',
        price: '39.99',
        stock_quantity: 0,
        available: false
      }
    ];

    const result = await db.insert(booksTable)
      .values(booksData)
      .returning()
      .execute();

    return result;
  };

  const testInput: CreateBookOrderInput = {
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+1234567890',
    customer_address: '123 Main St, City, State',
    items: [],
    notes: 'Test order notes'
  };

  it('should create a book order with single item', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [
        { book_id: books[0].id, quantity: 2 }
      ]
    };

    const result = await createBookOrder(input);

    // Verify order fields
    expect(result.customer_name).toEqual('John Doe');
    expect(result.customer_email).toEqual('john@example.com');
    expect(result.customer_phone).toEqual('+1234567890');
    expect(result.customer_address).toEqual('123 Main St, City, State');
    expect(result.notes).toEqual('Test order notes');
    expect(result.status).toEqual('pending');
    expect(result.total_amount).toEqual(39.98); // 19.99 * 2
    expect(typeof result.total_amount).toEqual('number');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a book order with multiple items', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [
        { book_id: books[0].id, quantity: 1 },
        { book_id: books[1].id, quantity: 2 }
      ]
    };

    const result = await createBookOrder(input);

    // Total: 19.99 * 1 + 29.99 * 2 = 79.97
    expect(result.total_amount).toEqual(79.97);
    expect(result.id).toBeDefined();
  });

  it('should save order and items to database', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [
        { book_id: books[0].id, quantity: 2 },
        { book_id: books[1].id, quantity: 1 }
      ]
    };

    const result = await createBookOrder(input);

    // Verify order was saved
    const orders = await db.select()
      .from(bookOrdersTable)
      .where(eq(bookOrdersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].customer_name).toEqual('John Doe');
    expect(parseFloat(orders[0].total_amount)).toEqual(69.97); // 19.99 * 2 + 29.99 * 1

    // Verify order items were saved
    const orderItems = await db.select()
      .from(bookOrderItemsTable)
      .where(eq(bookOrderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(2);
    
    // Check first item
    const item1 = orderItems.find(item => item.book_id === books[0].id);
    expect(item1).toBeDefined();
    expect(item1!.quantity).toEqual(2);
    expect(parseFloat(item1!.price)).toEqual(19.99);

    // Check second item
    const item2 = orderItems.find(item => item.book_id === books[1].id);
    expect(item2).toBeDefined();
    expect(item2!.quantity).toEqual(1);
    expect(parseFloat(item2!.price)).toEqual(29.99);
  });

  it('should handle order with null notes', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [{ book_id: books[0].id, quantity: 1 }],
      notes: null
    };

    const result = await createBookOrder(input);
    expect(result.notes).toBeNull();
  });

  it('should throw error for non-existent book', async () => {
    const input: CreateBookOrderInput = {
      ...testInput,
      items: [{ book_id: 999, quantity: 1 }]
    };

    await expect(createBookOrder(input)).rejects.toThrow(/one or more books not found/i);
  });

  it('should throw error for unavailable book', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [{ book_id: books[2].id, quantity: 1 }] // Unavailable book
    };

    await expect(createBookOrder(input)).rejects.toThrow(/one or more books are not available/i);
  });

  it('should throw error for insufficient stock', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [{ book_id: books[1].id, quantity: 10 }] // Book has only 5 in stock
    };

    await expect(createBookOrder(input)).rejects.toThrow(/insufficient stock for book/i);
  });

  it('should handle mixed valid and invalid books', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [
        { book_id: books[0].id, quantity: 1 },
        { book_id: 999, quantity: 1 } // Non-existent book
      ]
    };

    await expect(createBookOrder(input)).rejects.toThrow(/one or more books not found/i);
  });

  it('should calculate correct total for complex order', async () => {
    const books = await createTestBooks();

    const input: CreateBookOrderInput = {
      ...testInput,
      items: [
        { book_id: books[0].id, quantity: 3 }, // 19.99 * 3 = 59.97
        { book_id: books[1].id, quantity: 2 }  // 29.99 * 2 = 59.98
      ]
    };

    const result = await createBookOrder(input);
    
    // Total: 59.97 + 59.98 = 119.95
    expect(result.total_amount).toEqual(119.95);
  });
});