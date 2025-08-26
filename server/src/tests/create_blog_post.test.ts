import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable, blogCategoriesTable, blogTagsTable, blogPostTagsTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq, and } from 'drizzle-orm';

describe('createBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let tagId1: number;
  let tagId2: number;

  beforeEach(async () => {
    // Create test category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create test tags
    const tagResult1 = await db.insert(blogTagsTable)
      .values({
        name: 'Test Tag 1',
        slug: 'test-tag-1'
      })
      .returning()
      .execute();
    tagId1 = tagResult1[0].id;

    const tagResult2 = await db.insert(blogTagsTable)
      .values({
        name: 'Test Tag 2',
        slug: 'test-tag-2'
      })
      .returning()
      .execute();
    tagId2 = tagResult2[0].id;
  });

  it('should create a blog post with all required fields', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Test Blog Post',
      slug: 'test-blog-post',
      content: 'This is the content of the test blog post.',
      excerpt: 'Test excerpt',
      featured_image_url: 'https://example.com/image.jpg',
      category_id: categoryId,
      published: true
    };

    const result = await createBlogPost(testInput);

    // Verify returned post data
    expect(result.title).toEqual('Test Blog Post');
    expect(result.slug).toEqual('test-blog-post');
    expect(result.content).toEqual('This is the content of the test blog post.');
    expect(result.excerpt).toEqual('Test excerpt');
    expect(result.featured_image_url).toEqual('https://example.com/image.jpg');
    expect(result.category_id).toEqual(categoryId);
    expect(result.published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a blog post with minimal required fields', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Minimal Post',
      slug: 'minimal-post',
      content: 'Minimal content',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: false
    };

    const result = await createBlogPost(testInput);

    expect(result.title).toEqual('Minimal Post');
    expect(result.slug).toEqual('minimal-post');
    expect(result.content).toEqual('Minimal content');
    expect(result.excerpt).toBeNull();
    expect(result.featured_image_url).toBeNull();
    expect(result.category_id).toEqual(categoryId);
    expect(result.published).toBe(false);
    expect(result.published_at).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save blog post to database', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Database Test Post',
      slug: 'database-test-post',
      content: 'Content for database test',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: true
    };

    const result = await createBlogPost(testInput);

    // Query database to verify post was saved
    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toEqual('Database Test Post');
    expect(posts[0].slug).toEqual('database-test-post');
    expect(posts[0].content).toEqual('Content for database test');
    expect(posts[0].category_id).toEqual(categoryId);
    expect(posts[0].published).toBe(true);
    expect(posts[0].published_at).toBeInstanceOf(Date);
  });

  it('should create blog post with tags', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Post with Tags',
      slug: 'post-with-tags',
      content: 'This post has tags',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: false,
      tag_ids: [tagId1, tagId2]
    };

    const result = await createBlogPost(testInput);

    // Verify the post was created
    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Post with Tags');

    // Verify tag associations were created
    const postTags = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.post_id, result.id))
      .execute();

    expect(postTags).toHaveLength(2);
    
    const tagIds = postTags.map(pt => pt.tag_id).sort();
    expect(tagIds).toEqual([tagId1, tagId2].sort());
  });

  it('should create blog post without tags when tag_ids is empty array', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Post without Tags',
      slug: 'post-without-tags',
      content: 'This post has no tags',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: false,
      tag_ids: []
    };

    const result = await createBlogPost(testInput);

    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Post without Tags');

    // Verify no tag associations were created
    const postTags = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.post_id, result.id))
      .execute();

    expect(postTags).toHaveLength(0);
  });

  it('should create blog post without tags when tag_ids is undefined', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Post without Tags Undefined',
      slug: 'post-without-tags-undefined',
      content: 'This post has undefined tags',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: false
      // tag_ids is undefined
    };

    const result = await createBlogPost(testInput);

    expect(result.id).toBeDefined();
    expect(result.title).toEqual('Post without Tags Undefined');

    // Verify no tag associations were created
    const postTags = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.post_id, result.id))
      .execute();

    expect(postTags).toHaveLength(0);
  });

  it('should set published_at when published is true', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Published Post',
      slug: 'published-post',
      content: 'This post is published',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: true
    };

    const result = await createBlogPost(testInput);

    expect(result.published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();
  });

  it('should set published_at to null when published is false', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Draft Post',
      slug: 'draft-post',
      content: 'This post is a draft',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: false
    };

    const result = await createBlogPost(testInput);

    expect(result.published).toBe(false);
    expect(result.published_at).toBeNull();
  });

  it('should throw error when category does not exist', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Invalid Category Post',
      slug: 'invalid-category-post',
      content: 'This post has invalid category',
      excerpt: null,
      featured_image_url: null,
      category_id: 99999, // Non-existent category ID
      published: false
    };

    await expect(createBlogPost(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should throw error when tag does not exist', async () => {
    const testInput: CreateBlogPostInput = {
      title: 'Invalid Tag Post',
      slug: 'invalid-tag-post',
      content: 'This post has invalid tags',
      excerpt: null,
      featured_image_url: null,
      category_id: categoryId,
      published: false,
      tag_ids: [99999] // Non-existent tag ID
    };

    await expect(createBlogPost(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});