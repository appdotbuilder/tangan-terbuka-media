import { db } from '../db';
import { blogCommentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type BlogComment } from '../schema';

export const approveBlogComment = async (commentId: number): Promise<BlogComment> => {
  try {
    // Update the comment to set approved = true
    const result = await db
      .update(blogCommentsTable)
      .set({ 
        approved: true 
      })
      .where(eq(blogCommentsTable.id, commentId))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Comment with id ${commentId} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Blog comment approval failed:', error);
    throw error;
  }
};