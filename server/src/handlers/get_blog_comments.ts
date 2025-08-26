import { db } from '../db';
import { blogCommentsTable } from '../db/schema';
import { type BlogComment } from '../schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getBlogComments(postId: number, approvedOnly: boolean = true): Promise<BlogComment[]> {
  try {
    // Build conditions array
    const conditions = [eq(blogCommentsTable.post_id, postId)];
    
    // Add approved filter if requested
    if (approvedOnly) {
      conditions.push(eq(blogCommentsTable.approved, true));
    }

    // Build and execute query in one go
    const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
    
    const results = await db.select()
      .from(blogCommentsTable)
      .where(whereCondition)
      .orderBy(desc(blogCommentsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch blog comments:', error);
    throw error;
  }
}