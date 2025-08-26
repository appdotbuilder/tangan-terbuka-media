import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type CreateBookInput } from '../schema';
import { updateBook } from '../handlers/update_book';
import { eq } from 'drizzle-orm';

// Helper function to create a test book
const createTestBook = async (): Promise<number> => {
  const testBookData: CreateBookInput = {
    title: 'Original Book',
    author: 'Original Author',
    isbn: '978-0-123456-78-9',
    description: 'Original description',
    price: 19.99,
    cover_image_url: 'https://example.com/original-cover.jpg',
    stock_quantity: 50,
    published_year: 2020,
    publisher: 'Original Publisher',
    available: true
  };

  const result = await db.insert(booksTable)
    .values({
      ...testBookData,
      price: testBookData.price.toString() // Convert to string for database
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a book', async () => {
    // Create test book
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Updated Book Title',
      author: 'Updated Author',
      isbn: '978-0-987654-32-1',
      description: 'Updated description',
      price: 29.99,
      cover_image_url: 'https://example.com/updated-cover.jpg',
      stock_quantity: 75,
      published_year: 2023,
      publisher: 'Updated Publisher',
      available: false
    };

    const result = await updateBook(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(bookId);
    expect(result.title).toEqual('Updated Book Title');
    expect(result.author).toEqual('Updated Author');
    expect(result.isbn).toEqual('978-0-987654-32-1');
    expect(result.description).toEqual('Updated description');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toBe('number');
    expect(result.cover_image_url).toEqual('https://example.com/updated-cover.jpg');
    expect(result.stock_quantity).toEqual(75);
    expect(result.published_year).toEqual(2023);
    expect(result.publisher).toEqual('Updated Publisher');
    expect(result.available).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create test book
    const bookId = await createTestBook();

    const partialUpdate: UpdateBookInput = {
      id: bookId,
      title: 'Partially Updated Title',
      price: 39.99
    };

    const result = await updateBook(partialUpdate);

    // Verify only specified fields are updated
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.price).toEqual(39.99);
    expect(typeof result.price).toBe('number');
    
    // Verify other fields remain unchanged
    expect(result.author).toEqual('Original Author');
    expect(result.isbn).toEqual('978-0-123456-78-9');
    expect(result.description).toEqual('Original description');
    expect(result.stock_quantity).toEqual(50);
    expect(result.published_year).toEqual(2020);
    expect(result.publisher).toEqual('Original Publisher');
    expect(result.available).toEqual(true);
  });

  it('should update nullable fields to null', async () => {
    // Create test book
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      isbn: null,
      description: null,
      cover_image_url: null,
      published_year: null,
      publisher: null
    };

    const result = await updateBook(updateInput);

    // Verify nullable fields are set to null
    expect(result.isbn).toBeNull();
    expect(result.description).toBeNull();
    expect(result.cover_image_url).toBeNull();
    expect(result.published_year).toBeNull();
    expect(result.publisher).toBeNull();

    // Verify non-nullable fields remain unchanged
    expect(result.title).toEqual('Original Book');
    expect(result.author).toEqual('Original Author');
    expect(result.price).toEqual(19.99);
    expect(result.stock_quantity).toEqual(50);
    expect(result.available).toEqual(true);
  });

  it('should save changes to database', async () => {
    // Create test book
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Database Test Book',
      price: 49.99,
      stock_quantity: 100
    };

    await updateBook(updateInput);

    // Query database directly to verify changes are persisted
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();

    expect(books).toHaveLength(1);
    const book = books[0];
    expect(book.title).toEqual('Database Test Book');
    expect(parseFloat(book.price)).toEqual(49.99);
    expect(book.stock_quantity).toEqual(100);
    expect(book.updated_at).toBeInstanceOf(Date);
  });

  it('should update timestamp on every update', async () => {
    // Create test book
    const bookId = await createTestBook();

    // Get original timestamp
    const originalBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, bookId))
      .execute();
    const originalTimestamp = originalBooks[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateBookInput = {
      id: bookId,
      title: 'Timestamp Test Book'
    };

    const result = await updateBook(updateInput);

    // Verify timestamp is updated
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should handle numeric edge cases correctly', async () => {
    // Create test book
    const bookId = await createTestBook();

    const updateInput: UpdateBookInput = {
      id: bookId,
      price: 0.01, // Minimum price
      stock_quantity: 0, // Zero stock
      published_year: 1900 // Early year
    };

    const result = await updateBook(updateInput);

    expect(result.price).toEqual(0.01);
    expect(typeof result.price).toBe('number');
    expect(result.stock_quantity).toEqual(0);
    expect(result.published_year).toEqual(1900);
  });

  it('should throw error when book not found', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdateBookInput = {
      id: nonExistentId,
      title: 'This will fail'
    };

    await expect(updateBook(updateInput)).rejects.toThrow(/Book with id 99999 not found/i);
  });

  it('should handle empty update gracefully', async () => {
    // Create test book
    const bookId = await createTestBook();

    // Update with only ID (no other fields)
    const updateInput: UpdateBookInput = {
      id: bookId
    };

    const result = await updateBook(updateInput);

    // Should return the book with updated timestamp but no other changes
    expect(result.id).toEqual(bookId);
    expect(result.title).toEqual('Original Book');
    expect(result.author).toEqual('Original Author');
    expect(result.price).toEqual(19.99);
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});