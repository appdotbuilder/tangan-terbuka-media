import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogCategoriesTable } from '../db/schema';
import { getBlogCategories } from '../handlers/get_blog_categories';

describe('getBlogCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getBlogCategories();

    expect(result).toEqual([]);
  });

  it('should return all blog categories', async () => {
    // Create test categories
    await db.insert(blogCategoriesTable)
      .values([
        {
          name: 'Technology',
          slug: 'technology',
          description: 'Tech related posts'
        },
        {
          name: 'Travel',
          slug: 'travel',
          description: 'Travel experiences and tips'
        },
        {
          name: 'Food',
          slug: 'food',
          description: null
        }
      ])
      .execute();

    const result = await getBlogCategories();

    expect(result).toHaveLength(3);
    
    // Verify first category
    expect(result[0].name).toEqual('Technology');
    expect(result[0].slug).toEqual('technology');
    expect(result[0].description).toEqual('Tech related posts');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second category
    expect(result[1].name).toEqual('Travel');
    expect(result[1].slug).toEqual('travel');
    expect(result[1].description).toEqual('Travel experiences and tips');

    // Verify third category (with null description)
    expect(result[2].name).toEqual('Food');
    expect(result[2].slug).toEqual('food');
    expect(result[2].description).toBeNull();
  });

  it('should return categories ordered by id', async () => {
    // Insert categories in different order
    await db.insert(blogCategoriesTable)
      .values([
        { name: 'Zebra', slug: 'zebra', description: 'Last alphabetically' },
        { name: 'Alpha', slug: 'alpha', description: 'First alphabetically' },
        { name: 'Beta', slug: 'beta', description: 'Second alphabetically' }
      ])
      .execute();

    const result = await getBlogCategories();

    expect(result).toHaveLength(3);
    // Should be ordered by insertion order (id), not alphabetically
    expect(result[0].name).toEqual('Zebra');
    expect(result[1].name).toEqual('Alpha');
    expect(result[2].name).toEqual('Beta');
  });

  it('should handle single category', async () => {
    await db.insert(blogCategoriesTable)
      .values({
        name: 'Single Category',
        slug: 'single-category',
        description: 'Only one category'
      })
      .execute();

    const result = await getBlogCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Single Category');
    expect(result[0].slug).toEqual('single-category');
    expect(result[0].description).toEqual('Only one category');
    expect(typeof result[0].id).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle categories with special characters', async () => {
    await db.insert(blogCategoriesTable)
      .values({
        name: 'Tech & Innovation',
        slug: 'tech-innovation',
        description: 'Technology & innovation posts with "quotes" and symbols!'
      })
      .execute();

    const result = await getBlogCategories();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Tech & Innovation');
    expect(result[0].slug).toEqual('tech-innovation');
    expect(result[0].description).toEqual('Technology & innovation posts with "quotes" and symbols!');
  });
});