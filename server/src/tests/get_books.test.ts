import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBooksInput, type CreateBookInput } from '../schema';
import { getBooks } from '../handlers/get_books';

// Test book data
const testBook1: CreateBookInput = {
  title: 'Available Test Book',
  author: 'Test Author 1',
  isbn: '123456789',
  description: 'A test book that is available',
  price: 19.99,
  cover_image_url: 'http://example.com/cover1.jpg',
  stock_quantity: 50,
  published_year: 2023,
  publisher: 'Test Publisher',
  available: true
};

const testBook2: CreateBookInput = {
  title: 'Unavailable Test Book',
  author: 'Test Author 2',
  isbn: '987654321',
  description: 'A test book that is not available',
  price: 24.99,
  cover_image_url: null,
  stock_quantity: 0,
  published_year: 2022,
  publisher: 'Another Publisher',
  available: false
};

const testBook3: CreateBookInput = {
  title: 'Another Available Book',
  author: 'Test Author 3',
  isbn: null,
  description: null,
  price: 15.50,
  cover_image_url: null,
  stock_quantity: 25,
  published_year: null,
  publisher: null,
  available: true
};

describe('getBooks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all books when no filters are provided', async () => {
    // Create test books
    await db.insert(booksTable).values([
      {
        ...testBook1,
        price: testBook1.price.toString()
      },
      {
        ...testBook2,
        price: testBook2.price.toString()
      },
      {
        ...testBook3,
        price: testBook3.price.toString()
      }
    ]).execute();

    const result = await getBooks();

    expect(result).toHaveLength(3);
    
    // Verify numeric conversion
    result.forEach(book => {
      expect(typeof book.price).toBe('number');
    });

    // Verify specific book data
    const availableBook = result.find(book => book.title === 'Available Test Book');
    expect(availableBook).toBeDefined();
    expect(availableBook!.price).toBe(19.99);
    expect(availableBook!.available).toBe(true);
    expect(availableBook!.stock_quantity).toBe(50);
  });

  it('should filter books by availability status - available only', async () => {
    // Create test books
    await db.insert(booksTable).values([
      {
        ...testBook1,
        price: testBook1.price.toString()
      },
      {
        ...testBook2,
        price: testBook2.price.toString()
      },
      {
        ...testBook3,
        price: testBook3.price.toString()
      }
    ]).execute();

    const input: GetBooksInput = {
      available: true
    };

    const result = await getBooks(input);

    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(book.available).toBe(true);
      expect(typeof book.price).toBe('number');
    });

    const titles = result.map(book => book.title);
    expect(titles).toContain('Available Test Book');
    expect(titles).toContain('Another Available Book');
    expect(titles).not.toContain('Unavailable Test Book');
  });

  it('should filter books by availability status - unavailable only', async () => {
    // Create test books
    await db.insert(booksTable).values([
      {
        ...testBook1,
        price: testBook1.price.toString()
      },
      {
        ...testBook2,
        price: testBook2.price.toString()
      },
      {
        ...testBook3,
        price: testBook3.price.toString()
      }
    ]).execute();

    const input: GetBooksInput = {
      available: false
    };

    const result = await getBooks(input);

    expect(result).toHaveLength(1);
    expect(result[0].available).toBe(false);
    expect(result[0].title).toBe('Unavailable Test Book');
    expect(typeof result[0].price).toBe('number');
    expect(result[0].price).toBe(24.99);
  });

  it('should apply pagination with limit', async () => {
    // Create multiple test books
    const books = [];
    for (let i = 1; i <= 5; i++) {
      books.push({
        title: `Test Book ${i}`,
        author: `Author ${i}`,
        isbn: null,
        description: null,
        price: (10 + i).toString(),
        cover_image_url: null,
        stock_quantity: 10,
        published_year: null,
        publisher: null,
        available: true
      });
    }

    await db.insert(booksTable).values(books).execute();

    const input: GetBooksInput = {
      limit: 3
    };

    const result = await getBooks(input);

    expect(result).toHaveLength(3);
    result.forEach(book => {
      expect(typeof book.price).toBe('number');
    });
  });

  it('should apply pagination with limit and offset', async () => {
    // Create multiple test books
    const books = [];
    for (let i = 1; i <= 5; i++) {
      books.push({
        title: `Test Book ${i}`,
        author: `Author ${i}`,
        isbn: null,
        description: null,
        price: (10 + i).toString(),
        cover_image_url: null,
        stock_quantity: 10,
        published_year: null,
        publisher: null,
        available: true
      });
    }

    await db.insert(booksTable).values(books).execute();

    const input: GetBooksInput = {
      limit: 2,
      offset: 2
    };

    const result = await getBooks(input);

    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(typeof book.price).toBe('number');
    });
  });

  it('should combine filters and pagination', async () => {
    // Create mixed availability books
    const books = [];
    for (let i = 1; i <= 6; i++) {
      books.push({
        title: `Test Book ${i}`,
        author: `Author ${i}`,
        isbn: null,
        description: null,
        price: (10 + i).toString(),
        cover_image_url: null,
        stock_quantity: 10,
        published_year: null,
        publisher: null,
        available: i % 2 === 1 // Odd numbers are available, even numbers are not
      });
    }

    await db.insert(booksTable).values(books).execute();

    const input: GetBooksInput = {
      available: true,
      limit: 2,
      offset: 1
    };

    const result = await getBooks(input);

    expect(result).toHaveLength(2);
    result.forEach(book => {
      expect(book.available).toBe(true);
      expect(typeof book.price).toBe('number');
    });
  });

  it('should return empty array when no books match filter', async () => {
    // Create only available books
    await db.insert(booksTable).values([
      {
        ...testBook1,
        price: testBook1.price.toString()
      },
      {
        ...testBook3,
        price: testBook3.price.toString()
      }
    ]).execute();

    const input: GetBooksInput = {
      available: false
    };

    const result = await getBooks(input);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when database is empty', async () => {
    const result = await getBooks();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle books with null optional fields correctly', async () => {
    // Create book with many null fields
    await db.insert(booksTable).values([
      {
        title: 'Minimal Book',
        author: 'Author',
        isbn: null,
        description: null,
        price: '12.34',
        cover_image_url: null,
        stock_quantity: 5,
        published_year: null,
        publisher: null,
        available: true
      }
    ]).execute();

    const result = await getBooks();

    expect(result).toHaveLength(1);
    const book = result[0];
    expect(book.title).toBe('Minimal Book');
    expect(book.isbn).toBeNull();
    expect(book.description).toBeNull();
    expect(book.price).toBe(12.34);
    expect(book.cover_image_url).toBeNull();
    expect(book.published_year).toBeNull();
    expect(book.publisher).toBeNull();
    expect(book.created_at).toBeInstanceOf(Date);
    expect(book.updated_at).toBeInstanceOf(Date);
  });
});