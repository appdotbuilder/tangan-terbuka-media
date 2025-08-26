import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogCommentsTable, blogCategoriesTable, blogPostsTable } from '../db/schema';
import { type CreateBlogCommentInput } from '../schema';
import { createBlogComment } from '../handlers/create_blog_comment';
import { eq } from 'drizzle-orm';

describe('createBlogComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  async function createTestBlogPost() {
    // First create a blog category
    const categoryResult = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    // Then create a blog post
    const postResult = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        slug: 'test-blog-post',
        content: 'This is test content for the blog post.',
        excerpt: 'Test excerpt',
        category_id: categoryResult[0].id,
        published: true
      })
      .returning()
      .execute();

    return postResult[0];
  }

  it('should create a blog comment with approved false by default', async () => {
    const post = await createTestBlogPost();
    
    const testInput: CreateBlogCommentInput = {
      post_id: post.id,
      author_name: 'John Doe',
      author_email: 'john@example.com',
      content: 'This is a test comment.'
    };

    const result = await createBlogComment(testInput);

    // Basic field validation
    expect(result.post_id).toEqual(post.id);
    expect(result.author_name).toEqual('John Doe');
    expect(result.author_email).toEqual('john@example.com');
    expect(result.content).toEqual('This is a test comment.');
    expect(result.approved).toEqual(false); // Should default to false for moderation
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save comment to database', async () => {
    const post = await createTestBlogPost();
    
    const testInput: CreateBlogCommentInput = {
      post_id: post.id,
      author_name: 'Jane Smith',
      author_email: 'jane@example.com',
      content: 'Another test comment with different content.'
    };

    const result = await createBlogComment(testInput);

    // Query the database to verify the comment was saved
    const comments = await db.select()
      .from(blogCommentsTable)
      .where(eq(blogCommentsTable.id, result.id))
      .execute();

    expect(comments).toHaveLength(1);
    expect(comments[0].post_id).toEqual(post.id);
    expect(comments[0].author_name).toEqual('Jane Smith');
    expect(comments[0].author_email).toEqual('jane@example.com');
    expect(comments[0].content).toEqual('Another test comment with different content.');
    expect(comments[0].approved).toEqual(false);
    expect(comments[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when blog post does not exist', async () => {
    const testInput: CreateBlogCommentInput = {
      post_id: 99999, // Non-existent post ID
      author_name: 'John Doe',
      author_email: 'john@example.com',
      content: 'Comment on non-existent post.'
    };

    await expect(createBlogComment(testInput)).rejects.toThrow(/Blog post with id 99999 not found/i);
  });

  it('should create multiple comments for the same post', async () => {
    const post = await createTestBlogPost();
    
    const firstComment: CreateBlogCommentInput = {
      post_id: post.id,
      author_name: 'Alice',
      author_email: 'alice@example.com',
      content: 'First comment'
    };

    const secondComment: CreateBlogCommentInput = {
      post_id: post.id,
      author_name: 'Bob',
      author_email: 'bob@example.com',
      content: 'Second comment'
    };

    const firstResult = await createBlogComment(firstComment);
    const secondResult = await createBlogComment(secondComment);

    // Both comments should be created successfully
    expect(firstResult.id).toBeDefined();
    expect(secondResult.id).toBeDefined();
    expect(firstResult.id).not.toEqual(secondResult.id);

    // Verify both comments exist in database
    const comments = await db.select()
      .from(blogCommentsTable)
      .where(eq(blogCommentsTable.post_id, post.id))
      .execute();

    expect(comments).toHaveLength(2);
    
    const firstDbComment = comments.find(c => c.author_name === 'Alice');
    const secondDbComment = comments.find(c => c.author_name === 'Bob');
    
    expect(firstDbComment).toBeDefined();
    expect(secondDbComment).toBeDefined();
    expect(firstDbComment!.content).toEqual('First comment');
    expect(secondDbComment!.content).toEqual('Second comment');
  });

  it('should handle email validation correctly', async () => {
    const post = await createTestBlogPost();
    
    const testInput: CreateBlogCommentInput = {
      post_id: post.id,
      author_name: 'Test User',
      author_email: 'valid.email+test@example.co.uk',
      content: 'Comment with complex email format'
    };

    const result = await createBlogComment(testInput);

    expect(result.author_email).toEqual('valid.email+test@example.co.uk');
    expect(result.id).toBeDefined();
  });
});