import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { getBookById } from '../handlers/get_book_by_id';
import { eq } from 'drizzle-orm';

describe('getBookById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testBook = {
    title: 'The Great Book',
    author: 'Jane Author',
    isbn: '978-1234567890',
    description: 'A wonderful book about programming',
    price: '29.99', // Insert as string for numeric column
    cover_image_url: 'https://example.com/cover.jpg',
    stock_quantity: 50,
    published_year: 2023,
    publisher: 'Tech Books Publishing',
    available: true
  };

  it('should return a book when it exists', async () => {
    // Create test book
    const insertResults = await db.insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const createdBook = insertResults[0];
    
    // Test the handler
    const result = await getBookById(createdBook.id);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdBook.id);
    expect(result!.title).toBe('The Great Book');
    expect(result!.author).toBe('Jane Author');
    expect(result!.isbn).toBe('978-1234567890');
    expect(result!.description).toBe('A wonderful book about programming');
    expect(result!.price).toBe(29.99);
    expect(typeof result!.price).toBe('number');
    expect(result!.cover_image_url).toBe('https://example.com/cover.jpg');
    expect(result!.stock_quantity).toBe(50);
    expect(result!.published_year).toBe(2023);
    expect(result!.publisher).toBe('Tech Books Publishing');
    expect(result!.available).toBe(true);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when book does not exist', async () => {
    const result = await getBookById(999);
    expect(result).toBeNull();
  });

  it('should handle books with nullable fields', async () => {
    // Create book with minimal required fields
    const minimalBook = {
      title: 'Minimal Book',
      author: 'Simple Author',
      isbn: null,
      description: null,
      price: '15.50',
      cover_image_url: null,
      stock_quantity: 0,
      published_year: null,
      publisher: null,
      available: false
    };

    const insertResults = await db.insert(booksTable)
      .values(minimalBook)
      .returning()
      .execute();

    const createdBook = insertResults[0];
    const result = await getBookById(createdBook.id);

    expect(result).not.toBeNull();
    expect(result!.title).toBe('Minimal Book');
    expect(result!.author).toBe('Simple Author');
    expect(result!.isbn).toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.price).toBe(15.50);
    expect(typeof result!.price).toBe('number');
    expect(result!.cover_image_url).toBeNull();
    expect(result!.stock_quantity).toBe(0);
    expect(result!.published_year).toBeNull();
    expect(result!.publisher).toBeNull();
    expect(result!.available).toBe(false);
  });

  it('should verify book was correctly stored in database', async () => {
    // Create test book
    const insertResults = await db.insert(booksTable)
      .values(testBook)
      .returning()
      .execute();

    const createdBook = insertResults[0];
    
    // Verify through direct database query
    const dbResults = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, createdBook.id))
      .execute();

    expect(dbResults).toHaveLength(1);
    expect(dbResults[0].title).toBe('The Great Book');
    expect(dbResults[0].price).toBe('29.99'); // Raw DB value is string
    
    // Verify handler returns properly converted data
    const handlerResult = await getBookById(createdBook.id);
    expect(handlerResult!.price).toBe(29.99); // Handler converts to number
    expect(typeof handlerResult!.price).toBe('number');
  });

  it('should handle decimal prices correctly', async () => {
    const bookWithDecimal = {
      title: 'Expensive Book',
      author: 'Costly Author',
      isbn: null,
      description: null,
      price: '199.99',
      cover_image_url: null,
      stock_quantity: 1,
      published_year: null,
      publisher: null,
      available: true
    };

    const insertResults = await db.insert(booksTable)
      .values(bookWithDecimal)
      .returning()
      .execute();

    const result = await getBookById(insertResults[0].id);

    expect(result).not.toBeNull();
    expect(result!.price).toBe(199.99);
    expect(typeof result!.price).toBe('number');
  });
});