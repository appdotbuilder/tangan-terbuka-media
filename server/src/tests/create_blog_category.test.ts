import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogCategoriesTable } from '../db/schema';
import { type CreateBlogCategoryInput } from '../schema';
import { createBlogCategory } from '../handlers/create_blog_category';
import { eq } from 'drizzle-orm';

// Test inputs
const testInputWithDescription: CreateBlogCategoryInput = {
  name: 'Technology',
  slug: 'technology-test',
  description: 'Articles about technology and software development'
};

const testInputWithoutDescription: CreateBlogCategoryInput = {
  name: 'Sports',
  slug: 'sports-test',
  description: null
};

const testInputUndefinedDescription: CreateBlogCategoryInput = {
  name: 'Travel',
  slug: 'travel-test',
  description: null // Use null instead of undefined since the type only allows string | null
};

describe('createBlogCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a blog category with description', async () => {
    const result = await createBlogCategory(testInputWithDescription);

    // Basic field validation
    expect(result.name).toEqual('Technology');
    expect(result.slug).toEqual('technology-test');
    expect(result.description).toEqual('Articles about technology and software development');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a blog category with null description', async () => {
    const result = await createBlogCategory(testInputWithoutDescription);

    // Basic field validation
    expect(result.name).toEqual('Sports');
    expect(result.slug).toEqual('sports-test');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a blog category with null description', async () => {
    const result = await createBlogCategory(testInputUndefinedDescription);

    // Basic field validation
    expect(result.name).toEqual('Travel');
    expect(result.slug).toEqual('travel-test');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save blog category to database', async () => {
    const result = await createBlogCategory(testInputWithDescription);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(blogCategoriesTable)
      .where(eq(blogCategoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Technology');
    expect(categories[0].slug).toEqual('technology-test');
    expect(categories[0].description).toEqual('Articles about technology and software development');
    expect(categories[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce unique slug constraint', async () => {
    // Create first category with a unique slug for this test
    const firstCategoryInput: CreateBlogCategoryInput = {
      name: 'Technology',
      slug: 'tech-unique-test',
      description: 'First tech category'
    };
    
    await createBlogCategory(firstCategoryInput);

    // Try to create another category with the same slug
    const duplicateSlugInput: CreateBlogCategoryInput = {
      name: 'Tech News',
      slug: 'tech-unique-test', // Same slug as first category
      description: 'News about technology'
    };

    await expect(createBlogCategory(duplicateSlugInput)).rejects.toThrow(/unique constraint/i);
  });

  it('should create multiple categories with different data', async () => {
    // Create multiple categories
    const result1 = await createBlogCategory(testInputWithDescription);
    const result2 = await createBlogCategory(testInputWithoutDescription);
    const result3 = await createBlogCategory(testInputUndefinedDescription);

    // Verify all were created with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).not.toEqual(result3.id);
    expect(result1.id).not.toEqual(result3.id);

    // Query all categories from database
    const allCategories = await db.select()
      .from(blogCategoriesTable)
      .execute();

    expect(allCategories).toHaveLength(3);
    
    // Verify each category exists in the database
    const categoryNames = allCategories.map(cat => cat.name).sort();
    expect(categoryNames).toEqual(['Sports', 'Technology', 'Travel']);
  });

  it('should handle special characters in name and slug', async () => {
    const specialCharInput: CreateBlogCategoryInput = {
      name: 'Science & Research',
      slug: 'science-research-test',
      description: 'Articles about science & research activities'
    };

    const result = await createBlogCategory(specialCharInput);

    expect(result.name).toEqual('Science & Research');
    expect(result.slug).toEqual('science-research-test');
    expect(result.description).toEqual('Articles about science & research activities');
  });

  it('should handle empty string description', async () => {
    const emptyDescriptionInput: CreateBlogCategoryInput = {
      name: 'Music',
      slug: 'music-test',
      description: ''
    };

    const result = await createBlogCategory(emptyDescriptionInput);

    expect(result.name).toEqual('Music');
    expect(result.slug).toEqual('music-test');
    // PostgreSQL text column stores empty string as empty string, not null
    expect(result.description).toEqual('');
  });
});