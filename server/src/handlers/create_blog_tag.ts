import { db } from '../db';
import { blogTagsTable } from '../db/schema';
import { type CreateBlogTagInput, type BlogTag } from '../schema';

export const createBlogTag = async (input: CreateBlogTagInput): Promise<BlogTag> => {
  try {
    // Insert blog tag record
    const result = await db.insert(blogTagsTable)
      .values({
        name: input.name,
        slug: input.slug
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog tag creation failed:', error);
    throw error;
  }
};