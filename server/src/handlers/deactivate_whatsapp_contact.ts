import { db } from '../db';
import { whatsappContactsTable } from '../db/schema';
import { type WhatsappContact } from '../schema';
import { eq } from 'drizzle-orm';

export async function deactivateWhatsappContact(id: number): Promise<WhatsappContact | null> {
  try {
    // Update the contact to set active to false
    const result = await db.update(whatsappContactsTable)
      .set({ active: false })
      .where(eq(whatsappContactsTable.id, id))
      .returning()
      .execute();

    // Return the updated contact or null if not found
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('WhatsApp contact deactivation failed:', error);
    throw error;
  }
}