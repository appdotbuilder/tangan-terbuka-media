import { db } from '../db';
import { bookOrdersTable } from '../db/schema';
import { type UpdateBookOrderStatusInput, type BookOrder } from '../schema';
import { eq } from 'drizzle-orm';

export async function updateBookOrderStatus(input: UpdateBookOrderStatusInput): Promise<BookOrder> {
  try {
    // Update the order status and updated_at timestamp
    const result = await db.update(bookOrdersTable)
      .set({
        status: input.status,
        updated_at: new Date()
      })
      .where(eq(bookOrdersTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Book order with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const order = result[0];
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Book order status update failed:', error);
    throw error;
  }
}