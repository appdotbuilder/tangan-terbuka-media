import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogCategoriesTable, blogPostsTable, blogTagsTable, blogPostTagsTable, blogCommentsTable } from '../db/schema';
import { getBlogPostBySlug } from '../handlers/get_blog_post_by_slug';

describe('getBlogPostBySlug', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return blog post when found by slug', async () => {
    // Create test category first
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Technology',
        slug: 'technology',
        description: 'Tech articles'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test blog post
    await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: 'This is the content of the test blog post',
        excerpt: 'Test excerpt',
        featured_image_url: 'https://example.com/image.jpg',
        category_id: categoryId,
        published: true,
        published_at: new Date('2024-01-01')
      })
      .execute();

    const result = await getBlogPostBySlug('test-blog-post');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Test Blog Post');
    expect(result!.slug).toEqual('test-blog-post');
    expect(result!.content).toEqual('This is the content of the test blog post');
    expect(result!.excerpt).toEqual('Test excerpt');
    expect(result!.featured_image_url).toEqual('https://example.com/image.jpg');
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.published).toEqual(true);
    expect(result!.published_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.id).toBeDefined();
  });

  it('should return null when blog post not found', async () => {
    const result = await getBlogPostBySlug('non-existent-slug');
    
    expect(result).toBeNull();
  });

  it('should return published blog post', async () => {
    // Create test category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'News',
        slug: 'news',
        description: 'News articles'
      })
      .returning()
      .execute();

    // Create published blog post
    await db.insert(blogPostsTable)
      .values({
        title: 'Published Post',
        slug: 'published-post',
        content: 'Published content',
        excerpt: null,
        featured_image_url: null,
        category_id: categoryResult[0].id,
        published: true,
        published_at: new Date()
      })
      .execute();

    const result = await getBlogPostBySlug('published-post');

    expect(result).not.toBeNull();
    expect(result!.published).toEqual(true);
    expect(result!.published_at).toBeInstanceOf(Date);
  });

  it('should return unpublished blog post', async () => {
    // Create test category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Drafts',
        slug: 'drafts',
        description: 'Draft articles'
      })
      .returning()
      .execute();

    // Create unpublished blog post
    await db.insert(blogPostsTable)
      .values({
        title: 'Draft Post',
        slug: 'draft-post',
        content: 'Draft content',
        excerpt: 'Draft excerpt',
        featured_image_url: null,
        category_id: categoryResult[0].id,
        published: false,
        published_at: null
      })
      .execute();

    const result = await getBlogPostBySlug('draft-post');

    expect(result).not.toBeNull();
    expect(result!.published).toEqual(false);
    expect(result!.published_at).toBeNull();
  });

  it('should handle blog post with minimal data', async () => {
    // Create test category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Minimal',
        slug: 'minimal',
        description: null
      })
      .returning()
      .execute();

    // Create blog post with minimal required fields
    await db.insert(blogPostsTable)
      .values({
        title: 'Minimal Post',
        slug: 'minimal-post',
        content: 'Minimal content',
        excerpt: null,
        featured_image_url: null,
        category_id: categoryResult[0].id,
        published: false,
        published_at: null
      })
      .execute();

    const result = await getBlogPostBySlug('minimal-post');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Minimal Post');
    expect(result!.content).toEqual('Minimal content');
    expect(result!.excerpt).toBeNull();
    expect(result!.featured_image_url).toBeNull();
    expect(result!.published_at).toBeNull();
  });

  it('should return correct blog post when multiple posts exist', async () => {
    // Create test category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Multiple',
        slug: 'multiple',
        description: 'Multiple test articles'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create multiple blog posts
    await db.insert(blogPostsTable)
      .values([
        {
          title: 'First Post',
          slug: 'first-post',
          content: 'First content',
          category_id: categoryId,
          published: true
        },
        {
          title: 'Second Post',
          slug: 'second-post',
          content: 'Second content',
          category_id: categoryId,
          published: true
        },
        {
          title: 'Third Post',
          slug: 'third-post',
          content: 'Third content',
          category_id: categoryId,
          published: false
        }
      ])
      .execute();

    const result = await getBlogPostBySlug('second-post');

    expect(result).not.toBeNull();
    expect(result!.title).toEqual('Second Post');
    expect(result!.slug).toEqual('second-post');
    expect(result!.content).toEqual('Second content');
  });
});