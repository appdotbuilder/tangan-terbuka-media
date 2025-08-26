import { db } from '../db';
import { bookOrdersTable, bookOrderItemsTable, booksTable } from '../db/schema';
import { type CreateBookOrderInput, type BookOrder } from '../schema';
import { eq, inArray } from 'drizzle-orm';

export const createBookOrder = async (input: CreateBookOrderInput): Promise<BookOrder> => {
  try {
    // Validate all books exist and are available
    const bookIds = input.items.map(item => item.book_id);
    const books = await db.select()
      .from(booksTable)
      .where(inArray(booksTable.id, bookIds))
      .execute();

    if (books.length !== bookIds.length) {
      throw new Error('One or more books not found');
    }

    // Check if all books are available
    const unavailableBooks = books.filter(book => !book.available);
    if (unavailableBooks.length > 0) {
      throw new Error('One or more books are not available');
    }

    // Check stock availability
    for (const item of input.items) {
      const book = books.find(b => b.id === item.book_id);
      if (book && book.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for book: ${book.title}`);
      }
    }

    // Calculate total amount
    let totalAmount = 0;
    for (const item of input.items) {
      const book = books.find(b => b.id === item.book_id);
      if (book) {
        totalAmount += parseFloat(book.price) * item.quantity;
      }
    }

    // Create the order
    const orderResult = await db.insert(bookOrdersTable)
      .values({
        customer_name: input.customer_name,
        customer_email: input.customer_email,
        customer_phone: input.customer_phone,
        customer_address: input.customer_address,
        total_amount: totalAmount.toString(),
        notes: input.notes
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsData = input.items.map(item => {
      const book = books.find(b => b.id === item.book_id);
      return {
        order_id: order.id,
        book_id: item.book_id,
        quantity: item.quantity,
        price: book!.price // We already validated that all books exist
      };
    });

    await db.insert(bookOrderItemsTable)
      .values(orderItemsData)
      .execute();

    // Return the order with proper type conversion
    return {
      ...order,
      total_amount: parseFloat(order.total_amount)
    };
  } catch (error) {
    console.error('Book order creation failed:', error);
    throw error;
  }
};