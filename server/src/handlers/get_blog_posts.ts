import { db } from '../db';
import { blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type GetBlogPostsInput, type BlogPost } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getBlogPosts = async (input?: GetBlogPostsInput): Promise<BlogPost[]> => {
  try {
    // Apply pagination with defaults
    const limit = input?.limit ?? 10;
    const offset = input?.offset ?? 0;

    // Handle tag filtering case separately to avoid type conflicts
    if (input?.tag_id !== undefined) {
      // Build conditions array for tag filtering
      const tagConditions: SQL<unknown>[] = [
        eq(blogPostTagsTable.tag_id, input.tag_id)
      ];

      if (input?.category_id !== undefined) {
        tagConditions.push(eq(blogPostsTable.category_id, input.category_id));
      }

      if (input?.published !== undefined) {
        tagConditions.push(eq(blogPostsTable.published, input.published));
      }

      // Execute query with join for tag filtering
      const results = await db.select({
        id: blogPostsTable.id,
        title: blogPostsTable.title,
        slug: blogPostsTable.slug,
        content: blogPostsTable.content,
        excerpt: blogPostsTable.excerpt,
        featured_image_url: blogPostsTable.featured_image_url,
        category_id: blogPostsTable.category_id,
        published: blogPostsTable.published,
        published_at: blogPostsTable.published_at,
        created_at: blogPostsTable.created_at,
        updated_at: blogPostsTable.updated_at
      })
        .from(blogPostsTable)
        .innerJoin(
          blogPostTagsTable,
          eq(blogPostsTable.id, blogPostTagsTable.post_id)
        )
        .where(and(...tagConditions))
        .limit(limit)
        .offset(offset)
        .execute();

      return results;
    } else {
      // Build conditions array for simple filtering
      const simpleConditions: SQL<unknown>[] = [];

      if (input?.category_id !== undefined) {
        simpleConditions.push(eq(blogPostsTable.category_id, input.category_id));
      }

      if (input?.published !== undefined) {
        simpleConditions.push(eq(blogPostsTable.published, input.published));
      }

      // Execute simple query without joins
      if (simpleConditions.length > 0) {
        const results = await db.select()
          .from(blogPostsTable)
          .where(and(...simpleConditions))
          .limit(limit)
          .offset(offset)
          .execute();
        return results;
      } else {
        const results = await db.select()
          .from(blogPostsTable)
          .limit(limit)
          .offset(offset)
          .execute();
        return results;
      }
    }
  } catch (error) {
    console.error('Get blog posts failed:', error);
    throw error;
  }
};