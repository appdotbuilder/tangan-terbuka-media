import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { whatsappContactsTable } from '../db/schema';
import { type CreateWhatsappContactInput } from '../schema';
import { deactivateWhatsappContact } from '../handlers/deactivate_whatsapp_contact';
import { eq } from 'drizzle-orm';

// Test input for creating a WhatsApp contact
const testContactInput: CreateWhatsappContactInput = {
  name: 'John Doe',
  phone: '+1234567890',
  notes: 'Test contact for deactivation'
};

describe('deactivateWhatsappContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should deactivate an existing WhatsApp contact', async () => {
    // Create a test contact first
    const createResult = await db.insert(whatsappContactsTable)
      .values({
        name: testContactInput.name,
        phone: testContactInput.phone,
        notes: testContactInput.notes,
        active: true // Default active state
      })
      .returning()
      .execute();

    const createdContact = createResult[0];
    expect(createdContact.active).toBe(true);

    // Deactivate the contact
    const result = await deactivateWhatsappContact(createdContact.id);

    // Verify the result
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdContact.id);
    expect(result!.name).toEqual('John Doe');
    expect(result!.phone).toEqual('+1234567890');
    expect(result!.notes).toEqual('Test contact for deactivation');
    expect(result!.active).toBe(false);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should persist deactivation in database', async () => {
    // Create a test contact first
    const createResult = await db.insert(whatsappContactsTable)
      .values({
        name: testContactInput.name,
        phone: testContactInput.phone,
        notes: testContactInput.notes,
        active: true
      })
      .returning()
      .execute();

    const createdContact = createResult[0];

    // Deactivate the contact
    await deactivateWhatsappContact(createdContact.id);

    // Query the database to verify the contact is deactivated
    const contacts = await db.select()
      .from(whatsappContactsTable)
      .where(eq(whatsappContactsTable.id, createdContact.id))
      .execute();

    expect(contacts).toHaveLength(1);
    expect(contacts[0].active).toBe(false);
    expect(contacts[0].name).toEqual('John Doe');
    expect(contacts[0].phone).toEqual('+1234567890');
  });

  it('should return null for non-existent contact', async () => {
    // Try to deactivate a contact that doesn't exist
    const result = await deactivateWhatsappContact(99999);

    expect(result).toBeNull();
  });

  it('should handle already deactivated contact', async () => {
    // Create a test contact that is already deactivated
    const createResult = await db.insert(whatsappContactsTable)
      .values({
        name: testContactInput.name,
        phone: testContactInput.phone,
        notes: testContactInput.notes,
        active: false // Already deactivated
      })
      .returning()
      .execute();

    const createdContact = createResult[0];

    // Deactivate the already deactivated contact
    const result = await deactivateWhatsappContact(createdContact.id);

    // Should still return the contact with active = false
    expect(result).toBeDefined();
    expect(result!.id).toEqual(createdContact.id);
    expect(result!.active).toBe(false);
  });

  it('should preserve all other contact fields when deactivating', async () => {
    // Create a test contact with all fields
    const fullContactInput = {
      name: 'Jane Smith',
      phone: '+9876543210',
      notes: 'Important business contact',
      active: true
    };

    const createResult = await db.insert(whatsappContactsTable)
      .values(fullContactInput)
      .returning()
      .execute();

    const createdContact = createResult[0];

    // Deactivate the contact
    const result = await deactivateWhatsappContact(createdContact.id);

    // Verify all fields are preserved except active
    expect(result).toBeDefined();
    expect(result!.name).toEqual('Jane Smith');
    expect(result!.phone).toEqual('+9876543210');
    expect(result!.notes).toEqual('Important business contact');
    expect(result!.active).toBe(false);
    expect(result!.created_at).toEqual(createdContact.created_at);
  });
});