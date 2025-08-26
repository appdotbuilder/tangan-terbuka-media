import { db } from '../db';
import { whatsappContactsTable } from '../db/schema';
import { type CreateWhatsappContactInput, type WhatsappContact } from '../schema';

export const createWhatsappContact = async (input: CreateWhatsappContactInput): Promise<WhatsappContact> => {
  try {
    // Insert WhatsApp contact record
    const result = await db.insert(whatsappContactsTable)
      .values({
        name: input.name,
        phone: input.phone,
        notes: input.notes,
        active: true // Default to active for new contacts
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('WhatsApp contact creation failed:', error);
    throw error;
  }
};