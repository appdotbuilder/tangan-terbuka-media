import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput } from '../schema';
import { createBook } from '../handlers/create_book';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateBookInput = {
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  isbn: '978-0-7432-7356-5',
  description: 'A classic American novel set in the Jazz Age',
  price: 29.99,
  cover_image_url: 'https://example.com/cover.jpg',
  stock_quantity: 50,
  published_year: 1925,
  publisher: 'Scribner',
  available: true
};

// Test input with minimal required fields
const minimalInput: CreateBookInput = {
  title: 'Minimal Book',
  author: 'Test Author',
  isbn: null,
  description: null,
  price: 19.99,
  cover_image_url: null,
  stock_quantity: 10,
  published_year: null,
  publisher: null,
  available: true
};

describe('createBook', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a book with all fields', async () => {
    const result = await createBook(testInput);

    // Basic field validation
    expect(result.title).toEqual('The Great Gatsby');
    expect(result.author).toEqual('F. Scott Fitzgerald');
    expect(result.isbn).toEqual('978-0-7432-7356-5');
    expect(result.description).toEqual('A classic American novel set in the Jazz Age');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toEqual('number'); // Verify numeric conversion
    expect(result.cover_image_url).toEqual('https://example.com/cover.jpg');
    expect(result.stock_quantity).toEqual(50);
    expect(result.published_year).toEqual(1925);
    expect(result.publisher).toEqual('Scribner');
    expect(result.available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a book with minimal fields', async () => {
    const result = await createBook(minimalInput);

    expect(result.title).toEqual('Minimal Book');
    expect(result.author).toEqual('Test Author');
    expect(result.isbn).toEqual(null);
    expect(result.description).toEqual(null);
    expect(result.price).toEqual(19.99);
    expect(typeof result.price).toEqual('number'); // Verify numeric conversion
    expect(result.cover_image_url).toEqual(null);
    expect(result.stock_quantity).toEqual(10);
    expect(result.published_year).toEqual(null);
    expect(result.publisher).toEqual(null);
    expect(result.available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save book to database', async () => {
    const result = await createBook(testInput);

    // Query using proper drizzle syntax
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(books).toHaveLength(1);
    const savedBook = books[0];
    expect(savedBook.title).toEqual('The Great Gatsby');
    expect(savedBook.author).toEqual('F. Scott Fitzgerald');
    expect(savedBook.isbn).toEqual('978-0-7432-7356-5');
    expect(savedBook.description).toEqual('A classic American novel set in the Jazz Age');
    expect(parseFloat(savedBook.price)).toEqual(29.99); // Price stored as string in DB
    expect(savedBook.cover_image_url).toEqual('https://example.com/cover.jpg');
    expect(savedBook.stock_quantity).toEqual(50);
    expect(savedBook.published_year).toEqual(1925);
    expect(savedBook.publisher).toEqual('Scribner');
    expect(savedBook.available).toEqual(true);
    expect(savedBook.created_at).toBeInstanceOf(Date);
    expect(savedBook.updated_at).toBeInstanceOf(Date);
  });

  it('should handle books with zero stock quantity', async () => {
    const zeroStockInput: CreateBookInput = {
      ...testInput,
      stock_quantity: 0
    };

    const result = await createBook(zeroStockInput);

    expect(result.stock_quantity).toEqual(0);
    expect(result.available).toEqual(true); // Available can still be true even with 0 stock
  });

  it('should handle books marked as unavailable', async () => {
    const unavailableInput: CreateBookInput = {
      ...testInput,
      available: false
    };

    const result = await createBook(unavailableInput);

    expect(result.available).toEqual(false);
    expect(result.stock_quantity).toEqual(50); // Stock can exist even if not available
  });

  it('should handle very old publication years', async () => {
    const oldBookInput: CreateBookInput = {
      ...testInput,
      title: 'Ancient Text',
      published_year: 1455
    };

    const result = await createBook(oldBookInput);

    expect(result.published_year).toEqual(1455);
  });

  it('should handle decimal prices correctly', async () => {
    const decimalPriceInput: CreateBookInput = {
      ...testInput,
      price: 15.49
    };

    const result = await createBook(decimalPriceInput);

    expect(result.price).toEqual(15.49);
    expect(typeof result.price).toEqual('number');

    // Verify in database
    const books = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, result.id))
      .execute();

    expect(parseFloat(books[0].price)).toEqual(15.49);
  });

  it('should create multiple books successfully', async () => {
    const book1 = await createBook(testInput);
    const book2 = await createBook(minimalInput);

    expect(book1.id).not.toEqual(book2.id);
    expect(book1.title).toEqual('The Great Gatsby');
    expect(book2.title).toEqual('Minimal Book');

    // Verify both are in database
    const allBooks = await db.select()
      .from(booksTable)
      .execute();

    expect(allBooks).toHaveLength(2);
  });
});