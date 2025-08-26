import { db } from '../db';
import { bookOrdersTable } from '../db/schema';
import { type GetBookOrdersInput, type BookOrder } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getBookOrders(input?: GetBookOrdersInput): Promise<BookOrder[]> {
  try {
    // Build query with method chaining to avoid type issues
    const baseQuery = db.select().from(bookOrdersTable);
    
    // Apply filters and build final query
    const queryWithFilter = input?.status 
      ? baseQuery.where(eq(bookOrdersTable.status, input.status))
      : baseQuery;
    
    const queryWithOrder = queryWithFilter.orderBy(desc(bookOrdersTable.created_at));
    
    const queryWithLimit = input?.limit 
      ? queryWithOrder.limit(input.limit)
      : queryWithOrder;
    
    const finalQuery = input?.offset 
      ? queryWithLimit.offset(input.offset)
      : queryWithLimit;

    const results = await finalQuery.execute();

    // Convert numeric fields from string to number
    return results.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount)
    }));

  } catch (error) {
    console.error('Failed to fetch book orders:', error);
    throw error;
  }
}