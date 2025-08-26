import { db } from '../db';
import { blogPostsTable, blogCategoriesTable, blogPostTagsTable, blogTagsTable, blogCommentsTable } from '../db/schema';
import { type BlogPost } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // Fetch the blog post with its category
    const result = await db.select()
      .from(blogPostsTable)
      .innerJoin(blogCategoriesTable, eq(blogPostsTable.category_id, blogCategoriesTable.id))
      .where(eq(blogPostsTable.slug, slug))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const blogPostData = result[0].blog_posts;

    // Convert numeric fields and build the blog post object
    const blogPost: BlogPost = {
      ...blogPostData,
      id: blogPostData.id,
      title: blogPostData.title,
      slug: blogPostData.slug,
      content: blogPostData.content,
      excerpt: blogPostData.excerpt,
      featured_image_url: blogPostData.featured_image_url,
      category_id: blogPostData.category_id,
      published: blogPostData.published,
      published_at: blogPostData.published_at,
      created_at: blogPostData.created_at,
      updated_at: blogPostData.updated_at
    };

    return blogPost;
  } catch (error) {
    console.error('Failed to fetch blog post by slug:', error);
    throw error;
  }
}