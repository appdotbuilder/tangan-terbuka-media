import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { whatsappContactsTable } from '../db/schema';
import { type CreateWhatsappContactInput } from '../schema';
import { getWhatsappContacts } from '../handlers/get_whatsapp_contacts';

// Helper to create test contacts
const createTestContact = async (
  name: string,
  phone: string,
  active: boolean = true,
  notes: string | null = null
) => {
  const result = await db.insert(whatsappContactsTable)
    .values({
      name,
      phone,
      notes,
      active
    })
    .returning()
    .execute();

  return result[0];
};

describe('getWhatsappContacts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active contacts by default', async () => {
    // Create test contacts
    const activeContact = await createTestContact('John Doe', '+1234567890', true);
    const inactiveContact = await createTestContact('Jane Smith', '+9876543210', false);

    const results = await getWhatsappContacts();

    expect(results).toHaveLength(1);
    expect(results[0].id).toEqual(activeContact.id);
    expect(results[0].name).toEqual('John Doe');
    expect(results[0].phone).toEqual('+1234567890');
    expect(results[0].active).toBe(true);
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should return all contacts when activeOnly is false', async () => {
    // Create test contacts
    const activeContact = await createTestContact('John Doe', '+1234567890', true);
    const inactiveContact = await createTestContact('Jane Smith', '+9876543210', false);

    const results = await getWhatsappContacts(false);

    expect(results).toHaveLength(2);
    
    // Find contacts in results
    const johnContact = results.find(c => c.name === 'John Doe');
    const janeContact = results.find(c => c.name === 'Jane Smith');

    expect(johnContact).toBeDefined();
    expect(johnContact?.active).toBe(true);
    expect(janeContact).toBeDefined();
    expect(janeContact?.active).toBe(false);
  });

  it('should return contacts ordered by creation date (most recent first)', async () => {
    // Create contacts with slight delay to ensure different timestamps
    const firstContact = await createTestContact('First Contact', '+1111111111', true);
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const secondContact = await createTestContact('Second Contact', '+2222222222', true);
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const thirdContact = await createTestContact('Third Contact', '+3333333333', true);

    const results = await getWhatsappContacts();

    expect(results).toHaveLength(3);
    
    // Should be ordered by creation date descending (most recent first)
    expect(results[0].name).toEqual('Third Contact');
    expect(results[1].name).toEqual('Second Contact');
    expect(results[2].name).toEqual('First Contact');
    
    // Verify timestamps are in descending order
    expect(results[0].created_at >= results[1].created_at).toBe(true);
    expect(results[1].created_at >= results[2].created_at).toBe(true);
  });

  it('should return empty array when no contacts exist', async () => {
    const results = await getWhatsappContacts();
    
    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should return empty array when no active contacts exist', async () => {
    // Create only inactive contacts
    await createTestContact('Inactive Contact 1', '+1111111111', false);
    await createTestContact('Inactive Contact 2', '+2222222222', false);

    const results = await getWhatsappContacts(true);
    
    expect(results).toHaveLength(0);
    expect(Array.isArray(results)).toBe(true);
  });

  it('should handle contacts with notes', async () => {
    const contactWithNotes = await createTestContact(
      'Contact With Notes', 
      '+1234567890', 
      true, 
      'Important client for product launches'
    );
    
    const contactWithoutNotes = await createTestContact(
      'Contact Without Notes', 
      '+9876543210', 
      true, 
      null
    );

    const results = await getWhatsappContacts();

    expect(results).toHaveLength(2);
    
    const withNotes = results.find(c => c.name === 'Contact With Notes');
    const withoutNotes = results.find(c => c.name === 'Contact Without Notes');

    expect(withNotes?.notes).toEqual('Important client for product launches');
    expect(withoutNotes?.notes).toBeNull();
  });

  it('should return all required fields for each contact', async () => {
    const testContact = await createTestContact(
      'Test Contact', 
      '+1234567890', 
      true, 
      'Test notes'
    );

    const results = await getWhatsappContacts();

    expect(results).toHaveLength(1);
    const contact = results[0];

    // Verify all required fields are present
    expect(contact.id).toBeDefined();
    expect(typeof contact.id).toBe('number');
    expect(contact.name).toEqual('Test Contact');
    expect(contact.phone).toEqual('+1234567890');
    expect(contact.notes).toEqual('Test notes');
    expect(contact.active).toBe(true);
    expect(contact.created_at).toBeInstanceOf(Date);
  });

  it('should handle large number of contacts efficiently', async () => {
    // Create multiple active and inactive contacts
    const contactPromises = [];
    
    for (let i = 1; i <= 10; i++) {
      contactPromises.push(
        createTestContact(`Contact ${i}`, `+123456789${i}`, i % 3 !== 0) // Every 3rd contact is inactive
      );
    }
    
    await Promise.all(contactPromises);

    // Test active only
    const activeResults = await getWhatsappContacts(true);
    expect(activeResults.length).toBeGreaterThan(0);
    expect(activeResults.length).toBeLessThan(10); // Should be less than total
    
    // Verify all returned contacts are active
    activeResults.forEach(contact => {
      expect(contact.active).toBe(true);
    });

    // Test all contacts
    const allResults = await getWhatsappContacts(false);
    expect(allResults).toHaveLength(10);
  });
});