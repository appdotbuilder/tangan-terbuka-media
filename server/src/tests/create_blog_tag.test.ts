import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogTagsTable } from '../db/schema';
import { type CreateBlogTagInput } from '../schema';
import { createBlogTag } from '../handlers/create_blog_tag';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateBlogTagInput = {
  name: 'JavaScript',
  slug: 'javascript'
};

describe('createBlogTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a blog tag', async () => {
    const result = await createBlogTag(testInput);

    // Basic field validation
    expect(result.name).toEqual('JavaScript');
    expect(result.slug).toEqual('javascript');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save blog tag to database', async () => {
    const result = await createBlogTag(testInput);

    // Query using proper drizzle syntax
    const tags = await db.select()
      .from(blogTagsTable)
      .where(eq(blogTagsTable.id, result.id))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('JavaScript');
    expect(tags[0].slug).toEqual('javascript');
    expect(tags[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple tags with different names', async () => {
    const tag1 = await createBlogTag({
      name: 'TypeScript',
      slug: 'typescript'
    });

    const tag2 = await createBlogTag({
      name: 'React',
      slug: 'react'
    });

    expect(tag1.id).not.toEqual(tag2.id);
    expect(tag1.name).toEqual('TypeScript');
    expect(tag2.name).toEqual('React');

    // Verify both tags exist in database
    const allTags = await db.select()
      .from(blogTagsTable)
      .execute();

    expect(allTags).toHaveLength(2);
    
    const tagNames = allTags.map(tag => tag.name);
    expect(tagNames).toContain('TypeScript');
    expect(tagNames).toContain('React');
  });

  it('should handle special characters in tag name', async () => {
    const specialInput: CreateBlogTagInput = {
      name: 'C++ Programming',
      slug: 'cpp-programming'
    };

    const result = await createBlogTag(specialInput);

    expect(result.name).toEqual('C++ Programming');
    expect(result.slug).toEqual('cpp-programming');

    // Verify in database
    const tag = await db.select()
      .from(blogTagsTable)
      .where(eq(blogTagsTable.id, result.id))
      .execute();

    expect(tag[0].name).toEqual('C++ Programming');
    expect(tag[0].slug).toEqual('cpp-programming');
  });

  it('should enforce unique slug constraint', async () => {
    // Create first tag
    await createBlogTag(testInput);

    // Attempt to create tag with same slug should fail
    await expect(
      createBlogTag(testInput)
    ).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should allow same name with different slug', async () => {
    const tag1 = await createBlogTag({
      name: 'Web Development',
      slug: 'web-development'
    });

    const tag2 = await createBlogTag({
      name: 'Web Development',
      slug: 'web-dev'
    });

    expect(tag1.id).not.toEqual(tag2.id);
    expect(tag1.name).toEqual(tag2.name);
    expect(tag1.slug).not.toEqual(tag2.slug);
  });

  it('should handle long tag names', async () => {
    const longInput: CreateBlogTagInput = {
      name: 'Very Long Tag Name That Contains Multiple Words And Should Still Work Properly',
      slug: 'very-long-tag-name-slug'
    };

    const result = await createBlogTag(longInput);

    expect(result.name).toEqual(longInput.name);
    expect(result.slug).toEqual(longInput.slug);
    expect(result.id).toBeDefined();
  });
});