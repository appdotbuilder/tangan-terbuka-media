import { db } from '../db';
import { blogCategoriesTable } from '../db/schema';
import { type CreateBlogCategoryInput, type BlogCategory } from '../schema';

export const createBlogCategory = async (input: CreateBlogCategoryInput): Promise<BlogCategory> => {
  try {
    // Insert blog category record
    const result = await db.insert(blogCategoriesTable)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description
      })
      .returning()
      .execute();

    // Return the created blog category
    const category = result[0];
    return {
      ...category
    };
  } catch (error) {
    console.error('Blog category creation failed:', error);
    throw error;
  }
};