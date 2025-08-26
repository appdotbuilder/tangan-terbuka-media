import { db } from '../db';
import { blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type UpdateBlogPostInput, type BlogPost } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateBlogPost(input: UpdateBlogPostInput): Promise<BlogPost> {
  try {
    // Extract tag_ids and post data
    const { id, tag_ids, ...postData } = input;

    // Set updated_at timestamp for any update
    const updateData = {
      ...postData,
      updated_at: new Date(),
      // Set published_at when published is set to true
      ...(postData.published === true && {
        published_at: new Date()
      })
    };

    // Update the blog post
    const result = await db.update(blogPostsTable)
      .set(updateData)
      .where(eq(blogPostsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Blog post with id ${id} not found`);
    }

    const updatedPost = result[0];

    // Handle tag relationships if tag_ids are provided
    if (tag_ids !== undefined) {
      // Remove existing tag relationships
      await db.delete(blogPostTagsTable)
        .where(eq(blogPostTagsTable.post_id, id))
        .execute();

      // Add new tag relationships
      if (tag_ids.length > 0) {
        const tagRelations = tag_ids.map(tag_id => ({
          post_id: id,
          tag_id: tag_id
        }));

        await db.insert(blogPostTagsTable)
          .values(tagRelations)
          .execute();
      }
    }

    // Return the updated post with proper type conversion
    return {
      ...updatedPost,
      // Ensure dates are properly converted
      published_at: updatedPost.published_at ? new Date(updatedPost.published_at) : null,
      created_at: new Date(updatedPost.created_at),
      updated_at: new Date(updatedPost.updated_at)
    };
  } catch (error) {
    console.error('Blog post update failed:', error);
    throw error;
  }
}