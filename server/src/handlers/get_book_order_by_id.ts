import { db } from '../db';
import { bookOrdersTable, bookOrderItemsTable, booksTable } from '../db/schema';
import { type BookOrder } from '../schema';
import { eq } from 'drizzle-orm';

export async function getBookOrderById(id: number): Promise<BookOrder | null> {
  try {
    // First, get the book order
    const orderResults = await db.select()
      .from(bookOrdersTable)
      .where(eq(bookOrdersTable.id, id))
      .execute();

    if (orderResults.length === 0) {
      return null;
    }

    const order = orderResults[0];

    // Convert numeric fields back to numbers
    const bookOrder: BookOrder = {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };

    return bookOrder;
  } catch (error) {
    console.error('Failed to fetch book order:', error);
    throw error;
  }
}