import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { whatsappContactsTable } from '../db/schema';
import { type CreateWhatsappContactInput } from '../schema';
import { createWhatsappContact } from '../handlers/create_whatsapp_contact';
import { eq } from 'drizzle-orm';

// Test inputs
const basicInput: CreateWhatsappContactInput = {
  name: 'John Doe',
  phone: '+1234567890',
  notes: 'Test contact for broadcasting'
};

const minimalInput: CreateWhatsappContactInput = {
  name: 'Jane Smith',
  phone: '+0987654321',
  notes: null
};

const detailedInput: CreateWhatsappContactInput = {
  name: 'Business Contact',
  phone: '+1122334455',
  notes: 'Important client for product updates and announcements'
};

describe('createWhatsappContact', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a WhatsApp contact with all fields', async () => {
    const result = await createWhatsappContact(basicInput);

    // Verify all fields are set correctly
    expect(result.name).toEqual('John Doe');
    expect(result.phone).toEqual('+1234567890');
    expect(result.notes).toEqual('Test contact for broadcasting');
    expect(result.active).toBe(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a WhatsApp contact with minimal fields', async () => {
    const result = await createWhatsappContact(minimalInput);

    // Verify required fields and defaults
    expect(result.name).toEqual('Jane Smith');
    expect(result.phone).toEqual('+0987654321');
    expect(result.notes).toBeNull();
    expect(result.active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save WhatsApp contact to database', async () => {
    const result = await createWhatsappContact(detailedInput);

    // Query the database to verify the contact was saved
    const contacts = await db.select()
      .from(whatsappContactsTable)
      .where(eq(whatsappContactsTable.id, result.id))
      .execute();

    expect(contacts).toHaveLength(1);
    const savedContact = contacts[0];
    expect(savedContact.name).toEqual('Business Contact');
    expect(savedContact.phone).toEqual('+1122334455');
    expect(savedContact.notes).toEqual('Important client for product updates and announcements');
    expect(savedContact.active).toBe(true);
    expect(savedContact.created_at).toBeInstanceOf(Date);
  });

  it('should create multiple unique WhatsApp contacts', async () => {
    const contact1 = await createWhatsappContact(basicInput);
    const contact2 = await createWhatsappContact(minimalInput);

    // Verify both contacts were created with different IDs
    expect(contact1.id).not.toEqual(contact2.id);
    expect(contact1.name).toEqual('John Doe');
    expect(contact2.name).toEqual('Jane Smith');

    // Verify both contacts exist in database
    const allContacts = await db.select()
      .from(whatsappContactsTable)
      .execute();

    expect(allContacts).toHaveLength(2);
    
    const contact1Db = allContacts.find(c => c.id === contact1.id);
    const contact2Db = allContacts.find(c => c.id === contact2.id);
    
    expect(contact1Db).toBeDefined();
    expect(contact2Db).toBeDefined();
    expect(contact1Db?.phone).toEqual('+1234567890');
    expect(contact2Db?.phone).toEqual('+0987654321');
  });

  it('should handle contacts with same name but different phones', async () => {
    const input1: CreateWhatsappContactInput = {
      name: 'John Doe',
      phone: '+1111111111',
      notes: 'First John'
    };

    const input2: CreateWhatsappContactInput = {
      name: 'John Doe',
      phone: '+2222222222', 
      notes: 'Second John'
    };

    const contact1 = await createWhatsappContact(input1);
    const contact2 = await createWhatsappContact(input2);

    // Both should be created successfully with different IDs
    expect(contact1.id).not.toEqual(contact2.id);
    expect(contact1.name).toEqual(contact2.name);
    expect(contact1.phone).toEqual('+1111111111');
    expect(contact2.phone).toEqual('+2222222222');
    expect(contact1.notes).toEqual('First John');
    expect(contact2.notes).toEqual('Second John');
  });

  it('should set active to true by default', async () => {
    const result = await createWhatsappContact(basicInput);
    
    expect(result.active).toBe(true);
    
    // Verify in database as well
    const contacts = await db.select()
      .from(whatsappContactsTable)
      .where(eq(whatsappContactsTable.id, result.id))
      .execute();
    
    expect(contacts[0].active).toBe(true);
  });
});