import { db } from '../db';
import { blogCategoriesTable } from '../db/schema';
import { type BlogCategory } from '../schema';

export const getBlogCategories = async (): Promise<BlogCategory[]> => {
  try {
    const results = await db.select()
      .from(blogCategoriesTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch blog categories:', error);
    throw error;
  }
};