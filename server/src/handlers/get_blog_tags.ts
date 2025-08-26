import { db } from '../db';
import { blogTagsTable } from '../db/schema';
import { type BlogTag } from '../schema';
import { desc } from 'drizzle-orm';

export const getBlogTags = async (): Promise<BlogTag[]> => {
  try {
    const results = await db.select()
      .from(blogTagsTable)
      .orderBy(desc(blogTagsTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch blog tags:', error);
    throw error;
  }
};