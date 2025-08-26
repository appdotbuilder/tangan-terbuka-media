import { db } from '../db';
import { booksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Book } from '../schema';

export const getBookById = async (id: number): Promise<Book | null> => {
  try {
    const results = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const book = results[0];
    
    // Convert numeric fields from string to number
    return {
      ...book,
      price: parseFloat(book.price)
    };
  } catch (error) {
    console.error('Failed to fetch book by ID:', error);
    throw error;
  }
};