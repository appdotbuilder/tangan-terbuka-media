import { db } from '../db';
import { booksTable } from '../db/schema';
import { type UpdateBookInput, type Book } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBook = async (input: UpdateBookInput): Promise<Book> => {
  try {
    // First check if book exists
    const existingBooks = await db.select()
      .from(booksTable)
      .where(eq(booksTable.id, input.id))
      .execute();

    if (existingBooks.length === 0) {
      throw new Error(`Book with id ${input.id} not found`);
    }

    // Prepare update data - only include fields that are provided
    const updateData: any = {};
    
    if (input.title !== undefined) updateData.title = input.title;
    if (input.author !== undefined) updateData.author = input.author;
    if (input.isbn !== undefined) updateData.isbn = input.isbn;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = input.price.toString(); // Convert number to string for numeric column
    if (input.cover_image_url !== undefined) updateData.cover_image_url = input.cover_image_url;
    if (input.stock_quantity !== undefined) updateData.stock_quantity = input.stock_quantity;
    if (input.published_year !== undefined) updateData.published_year = input.published_year;
    if (input.publisher !== undefined) updateData.publisher = input.publisher;
    if (input.available !== undefined) updateData.available = input.available;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update book record
    const result = await db.update(booksTable)
      .set(updateData)
      .where(eq(booksTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const book = result[0];
    return {
      ...book,
      price: parseFloat(book.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Book update failed:', error);
    throw error;
  }
};