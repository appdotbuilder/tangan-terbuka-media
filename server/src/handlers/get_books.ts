import { db } from '../db';
import { booksTable } from '../db/schema';
import { type GetBooksInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBooks(input?: GetBooksInput): Promise<Book[]> {
  try {
    let results;

    // Handle all possible combinations to avoid TypeScript issues
    if (input?.available !== undefined) {
      if (input.limit !== undefined && input.offset !== undefined) {
        // Filter + limit + offset
        results = await db.select()
          .from(booksTable)
          .where(eq(booksTable.available, input.available))
          .limit(input.limit)
          .offset(input.offset)
          .execute();
      } else if (input.limit !== undefined) {
        // Filter + limit only
        results = await db.select()
          .from(booksTable)
          .where(eq(booksTable.available, input.available))
          .limit(input.limit)
          .execute();
      } else if (input.offset !== undefined) {
        // Filter + offset only
        results = await db.select()
          .from(booksTable)
          .where(eq(booksTable.available, input.available))
          .offset(input.offset)
          .execute();
      } else {
        // Filter only
        results = await db.select()
          .from(booksTable)
          .where(eq(booksTable.available, input.available))
          .execute();
      }
    } else {
      if (input?.limit !== undefined && input?.offset !== undefined) {
        // Limit + offset only
        results = await db.select()
          .from(booksTable)
          .limit(input.limit)
          .offset(input.offset)
          .execute();
      } else if (input?.limit !== undefined) {
        // Limit only
        results = await db.select()
          .from(booksTable)
          .limit(input.limit)
          .execute();
      } else if (input?.offset !== undefined) {
        // Offset only
        results = await db.select()
          .from(booksTable)
          .offset(input.offset)
          .execute();
      } else {
        // No filters or pagination
        results = await db.select()
          .from(booksTable)
          .execute();
      }
    }

    // Convert numeric fields back to numbers for return
    return results.map(book => ({
      ...book,
      price: parseFloat(book.price),
    }));
  } catch (error) {
    console.error('Get books failed:', error);
    throw error;
  }
}