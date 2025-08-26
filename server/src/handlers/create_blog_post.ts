import { db } from '../db';
import { blogPostsTable, blogPostTagsTable } from '../db/schema';
import { type CreateBlogPostInput, type BlogPost } from '../schema';

export const createBlogPost = async (input: CreateBlogPostInput): Promise<BlogPost> => {
  try {
    // Set published_at timestamp if the post is published
    const published_at = input.published ? new Date() : null;

    // Insert blog post record
    const result = await db.insert(blogPostsTable)
      .values({
        title: input.title,
        slug: input.slug,
        content: input.content,
        excerpt: input.excerpt,
        featured_image_url: input.featured_image_url,
        category_id: input.category_id,
        published: input.published,
        published_at: published_at
      })
      .returning()
      .execute();

    const blogPost = result[0];

    // Handle tag associations if provided
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tagInserts = input.tag_ids.map(tag_id => ({
        post_id: blogPost.id,
        tag_id: tag_id
      }));

      await db.insert(blogPostTagsTable)
        .values(tagInserts)
        .execute();
    }

    return blogPost;
  } catch (error) {
    console.error('Blog post creation failed:', error);
    throw error;
  }
};