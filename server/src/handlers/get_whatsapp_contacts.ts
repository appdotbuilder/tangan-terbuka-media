import { db } from '../db';
import { whatsappContactsTable } from '../db/schema';
import { type WhatsappContact } from '../schema';
import { eq, desc } from 'drizzle-orm';

export async function getWhatsappContacts(activeOnly: boolean = true): Promise<WhatsappContact[]> {
  try {
    // Build query with proper type inference
    const baseQuery = db.select()
      .from(whatsappContactsTable)
      .orderBy(desc(whatsappContactsTable.created_at));

    // Apply active filter conditionally
    const query = activeOnly
      ? baseQuery.where(eq(whatsappContactsTable.active, true))
      : baseQuery;

    const results = await query.execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch WhatsApp contacts:', error);
    throw error;
  }
}