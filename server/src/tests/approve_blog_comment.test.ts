import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogCategoriesTable, blogPostsTable, blogCommentsTable } from '../db/schema';
import { approveBlogComment } from '../handlers/approve_blog_comment';
import { eq } from 'drizzle-orm';

describe('approveBlogComment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should approve a blog comment successfully', async () => {
    // Create prerequisite data
    const [category] = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        category_id: category.id,
        published: true
      })
      .returning()
      .execute();

    // Create an unapproved comment
    const [comment] = await db.insert(blogCommentsTable)
      .values({
        post_id: post.id,
        author_name: 'John Doe',
        author_email: 'john@example.com',
        content: 'This is a test comment',
        approved: false
      })
      .returning()
      .execute();

    // Approve the comment
    const result = await approveBlogComment(comment.id);

    // Verify the result
    expect(result.id).toEqual(comment.id);
    expect(result.post_id).toEqual(post.id);
    expect(result.author_name).toEqual('John Doe');
    expect(result.author_email).toEqual('john@example.com');
    expect(result.content).toEqual('This is a test comment');
    expect(result.approved).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update the comment in the database', async () => {
    // Create prerequisite data
    const [category] = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        category_id: category.id,
        published: true
      })
      .returning()
      .execute();

    // Create an unapproved comment
    const [comment] = await db.insert(blogCommentsTable)
      .values({
        post_id: post.id,
        author_name: 'Jane Smith',
        author_email: 'jane@example.com',
        content: 'Another test comment',
        approved: false
      })
      .returning()
      .execute();

    // Verify comment is initially unapproved
    expect(comment.approved).toBe(false);

    // Approve the comment
    await approveBlogComment(comment.id);

    // Query the database to verify the update
    const updatedComments = await db.select()
      .from(blogCommentsTable)
      .where(eq(blogCommentsTable.id, comment.id))
      .execute();

    expect(updatedComments).toHaveLength(1);
    expect(updatedComments[0].approved).toBe(true);
    expect(updatedComments[0].author_name).toEqual('Jane Smith');
    expect(updatedComments[0].content).toEqual('Another test comment');
  });

  it('should throw error for non-existent comment', async () => {
    const nonExistentId = 999999;

    await expect(approveBlogComment(nonExistentId))
      .rejects
      .toThrow(/Comment with id 999999 not found/i);
  });

  it('should approve already approved comment without issues', async () => {
    // Create prerequisite data
    const [category] = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const [post] = await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        category_id: category.id,
        published: true
      })
      .returning()
      .execute();

    // Create an already approved comment
    const [comment] = await db.insert(blogCommentsTable)
      .values({
        post_id: post.id,
        author_name: 'Bob Wilson',
        author_email: 'bob@example.com',
        content: 'Already approved comment',
        approved: true
      })
      .returning()
      .execute();

    // Approve the already approved comment
    const result = await approveBlogComment(comment.id);

    // Verify it still works and remains approved
    expect(result.approved).toBe(true);
    expect(result.author_name).toEqual('Bob Wilson');
    expect(result.content).toEqual('Already approved comment');

    // Verify in database
    const dbComment = await db.select()
      .from(blogCommentsTable)
      .where(eq(blogCommentsTable.id, comment.id))
      .execute();

    expect(dbComment[0].approved).toBe(true);
  });
});