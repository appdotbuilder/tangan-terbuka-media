import { db } from '../db';
import { booksTable } from '../db/schema';
import { type CreateBookInput, type Book } from '../schema';

export const createBook = async (input: CreateBookInput): Promise<Book> => {
  try {
    // Insert book record
    const result = await db.insert(booksTable)
      .values({
        title: input.title,
        author: input.author,
        isbn: input.isbn,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        cover_image_url: input.cover_image_url,
        stock_quantity: input.stock_quantity, // Integer column - no conversion needed
        published_year: input.published_year,
        publisher: input.publisher,
        available: input.available
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const book = result[0];
    return {
      ...book,
      price: parseFloat(book.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Book creation failed:', error);
    throw error;
  }
};