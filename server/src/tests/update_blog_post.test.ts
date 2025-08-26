import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  blogPostsTable, 
  blogCategoriesTable, 
  blogTagsTable, 
  blogPostTagsTable 
} from '../db/schema';
import { type UpdateBlogPostInput } from '../schema';
import { updateBlogPost } from '../handlers/update_blog_post';
import { eq } from 'drizzle-orm';

describe('updateBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let categoryId: number;
  let postId: number;
  let tag1Id: number;
  let tag2Id: number;
  let tag3Id: number;

  beforeEach(async () => {
    // Create a blog category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Tech',
        slug: 'tech',
        description: 'Technology posts'
      })
      .returning()
      .execute();
    categoryId = categoryResult[0].id;

    // Create tags
    const tag1Result = await db.insert(blogTagsTable)
      .values({
        name: 'JavaScript',
        slug: 'javascript'
      })
      .returning()
      .execute();
    tag1Id = tag1Result[0].id;

    const tag2Result = await db.insert(blogTagsTable)
      .values({
        name: 'TypeScript',
        slug: 'typescript'
      })
      .returning()
      .execute();
    tag2Id = tag2Result[0].id;

    const tag3Result = await db.insert(blogTagsTable)
      .values({
        name: 'React',
        slug: 'react'
      })
      .returning()
      .execute();
    tag3Id = tag3Result[0].id;

    // Create a blog post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Original Title',
        slug: 'original-title',
        content: 'Original content',
        excerpt: 'Original excerpt',
        category_id: categoryId,
        published: false
      })
      .returning()
      .execute();
    postId = postResult[0].id;

    // Add initial tag relationships
    await db.insert(blogPostTagsTable)
      .values([
        { post_id: postId, tag_id: tag1Id }
      ])
      .execute();
  });

  it('should update basic post fields', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      title: 'Updated Title',
      content: 'Updated content',
      excerpt: 'Updated excerpt',
      published: true
    };

    const result = await updateBlogPost(updateInput);

    expect(result.id).toBe(postId);
    expect(result.title).toBe('Updated Title');
    expect(result.content).toBe('Updated content');
    expect(result.excerpt).toBe('Updated excerpt');
    expect(result.published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update post in database', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      title: 'Database Updated Title',
      slug: 'database-updated-title'
    };

    await updateBlogPost(updateInput);

    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, postId))
      .execute();

    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Database Updated Title');
    expect(posts[0].slug).toBe('database-updated-title');
    expect(posts[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set published_at when published is set to true', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      published: true
    };

    const result = await updateBlogPost(updateInput);

    expect(result.published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at!.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
  });

  it('should update tag relationships when tag_ids provided', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      tag_ids: [tag2Id, tag3Id]
    };

    await updateBlogPost(updateInput);

    // Check that old tags were removed and new ones added
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.post_id, postId))
      .execute();

    expect(tagRelations).toHaveLength(2);
    const tagIds = tagRelations.map(relation => relation.tag_id);
    expect(tagIds).toContain(tag2Id);
    expect(tagIds).toContain(tag3Id);
    expect(tagIds).not.toContain(tag1Id); // Original tag should be removed
  });

  it('should remove all tags when empty tag_ids array provided', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      tag_ids: []
    };

    await updateBlogPost(updateInput);

    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.post_id, postId))
      .execute();

    expect(tagRelations).toHaveLength(0);
  });

  it('should not modify tags when tag_ids not provided', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      title: 'Updated without tags'
    };

    await updateBlogPost(updateInput);

    // Original tag relationship should still exist
    const tagRelations = await db.select()
      .from(blogPostTagsTable)
      .where(eq(blogPostTagsTable.post_id, postId))
      .execute();

    expect(tagRelations).toHaveLength(1);
    expect(tagRelations[0].tag_id).toBe(tag1Id);
  });

  it('should update nullable fields to null', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      excerpt: null,
      featured_image_url: null
    };

    const result = await updateBlogPost(updateInput);

    expect(result.excerpt).toBeNull();
    expect(result.featured_image_url).toBeNull();
  });

  it('should throw error when post does not exist', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: 99999,
      title: 'Non-existent post'
    };

    await expect(updateBlogPost(updateInput))
      .rejects.toThrow(/Blog post with id 99999 not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const updateInput: UpdateBlogPostInput = {
      id: postId,
      featured_image_url: 'https://example.com/image.jpg'
    };

    const result = await updateBlogPost(updateInput);

    // Only featured_image_url should be updated, other fields remain unchanged
    expect(result.featured_image_url).toBe('https://example.com/image.jpg');
    expect(result.title).toBe('Original Title'); // Should remain unchanged
    expect(result.content).toBe('Original content'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update category_id when provided', async () => {
    // Create another category
    const newCategoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Design',
        slug: 'design',
        description: 'Design posts'
      })
      .returning()
      .execute();
    const newCategoryId = newCategoryResult[0].id;

    const updateInput: UpdateBlogPostInput = {
      id: postId,
      category_id: newCategoryId
    };

    const result = await updateBlogPost(updateInput);

    expect(result.category_id).toBe(newCategoryId);
  });
});