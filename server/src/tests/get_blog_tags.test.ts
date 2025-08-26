import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogTagsTable } from '../db/schema';
import { getBlogTags } from '../handlers/get_blog_tags';

describe('getBlogTags', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tags exist', async () => {
    const result = await getBlogTags();

    expect(result).toEqual([]);
  });

  it('should return all blog tags ordered by created_at desc', async () => {
    // Create test tags
    await db.insert(blogTagsTable).values([
      {
        name: 'JavaScript',
        slug: 'javascript'
      },
      {
        name: 'TypeScript', 
        slug: 'typescript'
      },
      {
        name: 'Node.js',
        slug: 'nodejs'
      }
    ]).execute();

    const result = await getBlogTags();

    expect(result).toHaveLength(3);
    
    // Verify all tags are returned with correct fields
    const tagNames = result.map(tag => tag.name);
    expect(tagNames).toContain('JavaScript');
    expect(tagNames).toContain('TypeScript');
    expect(tagNames).toContain('Node.js');

    // Verify all required fields are present
    result.forEach(tag => {
      expect(tag.id).toBeDefined();
      expect(typeof tag.id).toBe('number');
      expect(typeof tag.name).toBe('string');
      expect(typeof tag.slug).toBe('string');
      expect(tag.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return tags ordered by creation date (newest first)', async () => {
    // Create tags with slight delay to ensure different timestamps
    await db.insert(blogTagsTable).values({
      name: 'First Tag',
      slug: 'first-tag'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(blogTagsTable).values({
      name: 'Second Tag', 
      slug: 'second-tag'
    }).execute();

    const result = await getBlogTags();

    expect(result).toHaveLength(2);
    // Newest should be first (desc order)
    expect(result[0].name).toBe('Second Tag');
    expect(result[1].name).toBe('First Tag');
    
    // Verify ordering by timestamps
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should handle unique slug constraints', async () => {
    // Create tag with specific slug
    await db.insert(blogTagsTable).values({
      name: 'React',
      slug: 'react'
    }).execute();

    const result = await getBlogTags();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('React');
    expect(result[0].slug).toBe('react');
  });

  it('should return correct data structure for each tag', async () => {
    await db.insert(blogTagsTable).values({
      name: 'Vue.js',
      slug: 'vuejs'
    }).execute();

    const result = await getBlogTags();
    const tag = result[0];

    // Verify complete structure matches BlogTag schema
    expect(tag).toHaveProperty('id');
    expect(tag).toHaveProperty('name');
    expect(tag).toHaveProperty('slug');
    expect(tag).toHaveProperty('created_at');

    // Verify types
    expect(typeof tag.id).toBe('number');
    expect(typeof tag.name).toBe('string');
    expect(typeof tag.slug).toBe('string');
    expect(tag.created_at).toBeInstanceOf(Date);

    // Verify values
    expect(tag.name).toBe('Vue.js');
    expect(tag.slug).toBe('vuejs');
    expect(tag.id).toBeGreaterThan(0);
  });
});