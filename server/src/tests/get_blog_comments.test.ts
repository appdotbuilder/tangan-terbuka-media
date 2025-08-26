import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogCategoriesTable, blogPostsTable, blogCommentsTable } from '../db/schema';
import { getBlogComments } from '../handlers/get_blog_comments';

describe('getBlogComments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create test data
  const createTestData = async () => {
    // Create test category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test blog post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        category_id: categoryId,
        published: true
      })
      .returning()
      .execute();

    const postId = postResult[0].id;

    // Create another post for isolation testing
    const otherPostResult = await db.insert(blogPostsTable)
      .values({
        title: 'Other Post',
        slug: 'other-post',
        content: 'Other content',
        category_id: categoryId,
        published: true
      })
      .returning()
      .execute();

    const otherPostId = otherPostResult[0].id;

    return { postId, otherPostId, categoryId };
  };

  it('should return approved comments for a post', async () => {
    const { postId } = await createTestData();

    // Create test comments one by one to ensure proper ordering
    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'John Doe',
        author_email: 'john@example.com',
        content: 'Great post!',
        approved: true
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Jane Smith',
        author_email: 'jane@example.com',
        content: 'Very helpful!',
        approved: true
      })
      .execute();

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Bob Wilson',
        author_email: 'bob@example.com',
        content: 'Pending comment',
        approved: false
      })
      .execute();

    const result = await getBlogComments(postId, true);

    expect(result).toHaveLength(2);
    expect(result[0].author_name).toEqual('Jane Smith'); // Newest first due to ordering
    expect(result[1].author_name).toEqual('John Doe');
    expect(result.every(comment => comment.approved === true)).toBe(true);
    expect(result.every(comment => comment.post_id === postId)).toBe(true);
  });

  it('should return all comments when approvedOnly is false', async () => {
    const { postId } = await createTestData();

    // Create test comments with mixed approval status
    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Approved User',
        author_email: 'approved@example.com',
        content: 'Approved comment',
        approved: true
      })
      .execute();

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Pending User',
        author_email: 'pending@example.com',
        content: 'Pending comment',
        approved: false
      })
      .execute();

    const result = await getBlogComments(postId, false);

    expect(result).toHaveLength(2);
    expect(result.some(comment => comment.approved === true)).toBe(true);
    expect(result.some(comment => comment.approved === false)).toBe(true);
    expect(result.every(comment => comment.post_id === postId)).toBe(true);
  });

  it('should return empty array for post with no comments', async () => {
    const { postId } = await createTestData();

    const result = await getBlogComments(postId);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return comments for the specified post', async () => {
    const { postId, otherPostId } = await createTestData();

    // Create comments for both posts
    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Post 1 Commenter',
        author_email: 'post1@example.com',
        content: 'Comment on post 1',
        approved: true
      })
      .execute();

    await db.insert(blogCommentsTable)
      .values({
        post_id: otherPostId,
        author_name: 'Post 2 Commenter',
        author_email: 'post2@example.com',
        content: 'Comment on post 2',
        approved: true
      })
      .execute();

    const result = await getBlogComments(postId);

    expect(result).toHaveLength(1);
    expect(result[0].author_name).toEqual('Post 1 Commenter');
    expect(result[0].post_id).toEqual(postId);
  });

  it('should return comments ordered by creation date (newest first)', async () => {
    const { postId } = await createTestData();

    // Create comments with slight delay to ensure different timestamps
    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'First Comment',
        author_email: 'first@example.com',
        content: 'First comment',
        approved: true
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Second Comment',
        author_email: 'second@example.com',
        content: 'Second comment',
        approved: true
      })
      .execute();

    const result = await getBlogComments(postId);

    expect(result).toHaveLength(2);
    expect(result[0].author_name).toEqual('Second Comment'); // Newest first
    expect(result[1].author_name).toEqual('First Comment');
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should return comments with all required fields', async () => {
    const { postId } = await createTestData();

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Test Author',
        author_email: 'test@example.com',
        content: 'Test comment content',
        approved: true
      })
      .execute();

    const result = await getBlogComments(postId);

    expect(result).toHaveLength(1);
    const comment = result[0];

    expect(comment.id).toBeDefined();
    expect(comment.post_id).toEqual(postId);
    expect(comment.author_name).toEqual('Test Author');
    expect(comment.author_email).toEqual('test@example.com');
    expect(comment.content).toEqual('Test comment content');
    expect(comment.approved).toBe(true);
    expect(comment.created_at).toBeInstanceOf(Date);
  });

  it('should default to approvedOnly when second parameter is not provided', async () => {
    const { postId } = await createTestData();

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Approved',
        author_email: 'approved@example.com',
        content: 'Approved comment',
        approved: true
      })
      .execute();

    await db.insert(blogCommentsTable)
      .values({
        post_id: postId,
        author_name: 'Not Approved',
        author_email: 'notapproved@example.com',
        content: 'Not approved comment',
        approved: false
      })
      .execute();

    // Call without second parameter - should default to approvedOnly = true
    const result = await getBlogComments(postId);

    expect(result).toHaveLength(1);
    expect(result[0].approved).toBe(true);
    expect(result[0].author_name).toEqual('Approved');
  });
});