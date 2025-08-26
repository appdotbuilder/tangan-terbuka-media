import { db } from '../db';
import { blogCommentsTable, blogPostsTable } from '../db/schema';
import { type CreateBlogCommentInput, type BlogComment } from '../schema';
import { eq } from 'drizzle-orm';

export async function createBlogComment(input: CreateBlogCommentInput): Promise<BlogComment> {
  try {
    // First verify that the blog post exists
    const post = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, input.post_id))
      .execute();

    if (post.length === 0) {
      throw new Error(`Blog post with id ${input.post_id} not found`);
    }

    // Insert comment record with approved = false by default for moderation
    const result = await db.insert(blogCommentsTable)
      .values({
        post_id: input.post_id,
        author_name: input.author_name,
        author_email: input.author_email,
        content: input.content,
        approved: false // Default to false for moderation
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog comment creation failed:', error);
    throw error;
  }
}