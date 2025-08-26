import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  blogCategoriesTable, 
  blogTagsTable, 
  blogPostsTable, 
  blogPostTagsTable 
} from '../db/schema';
import { type GetBlogPostsInput } from '../schema';
import { getBlogPosts } from '../handlers/get_blog_posts';

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no posts exist', async () => {
    const result = await getBlogPosts();
    expect(result).toEqual([]);
  });

  it('should get all posts without filters', async () => {
    // Create category
    const category = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create posts
    const posts = await db.insert(blogPostsTable)
      .values([
        {
          title: 'First Post',
          slug: 'first-post',
          content: 'Content of first post',
          excerpt: 'First excerpt',
          category_id: category[0].id,
          published: true
        },
        {
          title: 'Second Post',
          slug: 'second-post',
          content: 'Content of second post',
          excerpt: 'Second excerpt',
          category_id: category[0].id,
          published: false
        }
      ])
      .returning()
      .execute();

    const result = await getBlogPosts();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('First Post');
    expect(result[0].published).toBe(true);
    expect(result[0].category_id).toEqual(category[0].id);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[1].title).toEqual('Second Post');
    expect(result[1].published).toBe(false);
  });

  it('should filter posts by published status', async () => {
    // Create category
    const category = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create posts with different published status
    await db.insert(blogPostsTable)
      .values([
        {
          title: 'Published Post',
          slug: 'published-post',
          content: 'Published content',
          category_id: category[0].id,
          published: true
        },
        {
          title: 'Draft Post',
          slug: 'draft-post',
          content: 'Draft content',
          category_id: category[0].id,
          published: false
        }
      ])
      .execute();

    // Test filtering for published posts
    const publishedPosts = await getBlogPosts({ published: true });
    expect(publishedPosts).toHaveLength(1);
    expect(publishedPosts[0].title).toEqual('Published Post');
    expect(publishedPosts[0].published).toBe(true);

    // Test filtering for draft posts
    const draftPosts = await getBlogPosts({ published: false });
    expect(draftPosts).toHaveLength(1);
    expect(draftPosts[0].title).toEqual('Draft Post');
    expect(draftPosts[0].published).toBe(false);
  });

  it('should filter posts by category', async () => {
    // Create categories
    const categories = await db.insert(blogCategoriesTable)
      .values([
        {
          name: 'Tech Category',
          slug: 'tech-category',
          description: 'Technology posts'
        },
        {
          name: 'News Category',
          slug: 'news-category',
          description: 'News posts'
        }
      ])
      .returning()
      .execute();

    // Create posts in different categories
    await db.insert(blogPostsTable)
      .values([
        {
          title: 'Tech Post',
          slug: 'tech-post',
          content: 'Technology content',
          category_id: categories[0].id,
          published: true
        },
        {
          title: 'News Post',
          slug: 'news-post',
          content: 'News content',
          category_id: categories[1].id,
          published: true
        }
      ])
      .execute();

    const techPosts = await getBlogPosts({ category_id: categories[0].id });
    expect(techPosts).toHaveLength(1);
    expect(techPosts[0].title).toEqual('Tech Post');
    expect(techPosts[0].category_id).toEqual(categories[0].id);

    const newsPosts = await getBlogPosts({ category_id: categories[1].id });
    expect(newsPosts).toHaveLength(1);
    expect(newsPosts[0].title).toEqual('News Post');
    expect(newsPosts[0].category_id).toEqual(categories[1].id);
  });

  it('should filter posts by tag', async () => {
    // Create category
    const category = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create tags
    const tags = await db.insert(blogTagsTable)
      .values([
        {
          name: 'JavaScript',
          slug: 'javascript'
        },
        {
          name: 'Python',
          slug: 'python'
        }
      ])
      .returning()
      .execute();

    // Create posts
    const posts = await db.insert(blogPostsTable)
      .values([
        {
          title: 'JS Post',
          slug: 'js-post',
          content: 'JavaScript content',
          category_id: category[0].id,
          published: true
        },
        {
          title: 'Python Post',
          slug: 'python-post',
          content: 'Python content',
          category_id: category[0].id,
          published: true
        },
        {
          title: 'Untagged Post',
          slug: 'untagged-post',
          content: 'No tags',
          category_id: category[0].id,
          published: true
        }
      ])
      .returning()
      .execute();

    // Create post-tag associations
    await db.insert(blogPostTagsTable)
      .values([
        {
          post_id: posts[0].id,
          tag_id: tags[0].id
        },
        {
          post_id: posts[1].id,
          tag_id: tags[1].id
        }
      ])
      .execute();

    // Test filtering by JavaScript tag
    const jsPosts = await getBlogPosts({ tag_id: tags[0].id });
    expect(jsPosts).toHaveLength(1);
    expect(jsPosts[0].title).toEqual('JS Post');

    // Test filtering by Python tag
    const pythonPosts = await getBlogPosts({ tag_id: tags[1].id });
    expect(pythonPosts).toHaveLength(1);
    expect(pythonPosts[0].title).toEqual('Python Post');
  });

  it('should apply pagination correctly', async () => {
    // Create category
    const category = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create multiple posts
    const postData = Array.from({ length: 15 }, (_, i) => ({
      title: `Post ${i + 1}`,
      slug: `post-${i + 1}`,
      content: `Content for post ${i + 1}`,
      category_id: category[0].id,
      published: true
    }));

    await db.insert(blogPostsTable)
      .values(postData)
      .execute();

    // Test default pagination
    const defaultResult = await getBlogPosts();
    expect(defaultResult).toHaveLength(10); // Default limit

    // Test custom limit
    const limitedResult = await getBlogPosts({ limit: 5 });
    expect(limitedResult).toHaveLength(5);

    // Test offset
    const offsetResult = await getBlogPosts({ limit: 5, offset: 5 });
    expect(offsetResult).toHaveLength(5);
    expect(offsetResult[0].title).toEqual('Post 6'); // Should start from 6th post

    // Test limit larger than available posts
    const largeLimit = await getBlogPosts({ limit: 20 });
    expect(largeLimit).toHaveLength(15); // Should return all 15 posts
  });

  it('should combine multiple filters', async () => {
    // Create categories
    const categories = await db.insert(blogCategoriesTable)
      .values([
        {
          name: 'Tech Category',
          slug: 'tech-category',
          description: 'Technology posts'
        },
        {
          name: 'News Category',
          slug: 'news-category',
          description: 'News posts'
        }
      ])
      .returning()
      .execute();

    // Create tag
    const tag = await db.insert(blogTagsTable)
      .values({
        name: 'JavaScript',
        slug: 'javascript'
      })
      .returning()
      .execute();

    // Create posts
    const posts = await db.insert(blogPostsTable)
      .values([
        {
          title: 'Published Tech JS Post',
          slug: 'published-tech-js',
          content: 'Published tech JavaScript content',
          category_id: categories[0].id,
          published: true
        },
        {
          title: 'Draft Tech JS Post',
          slug: 'draft-tech-js',
          content: 'Draft tech JavaScript content',
          category_id: categories[0].id,
          published: false
        },
        {
          title: 'Published News JS Post',
          slug: 'published-news-js',
          content: 'Published news JavaScript content',
          category_id: categories[1].id,
          published: true
        }
      ])
      .returning()
      .execute();

    // Create post-tag associations
    await db.insert(blogPostTagsTable)
      .values([
        { post_id: posts[0].id, tag_id: tag[0].id },
        { post_id: posts[1].id, tag_id: tag[0].id },
        { post_id: posts[2].id, tag_id: tag[0].id }
      ])
      .execute();

    // Test combining category, tag, and published filters
    const result = await getBlogPosts({
      category_id: categories[0].id,
      tag_id: tag[0].id,
      published: true,
      limit: 5
    });

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published Tech JS Post');
    expect(result[0].category_id).toEqual(categories[0].id);
    expect(result[0].published).toBe(true);
  });

  it('should handle no results gracefully', async () => {
    // Create category
    const category = await db.insert(blogCategoriesTable)
      .values({
        name: 'Test Category',
        slug: 'test-category',
        description: 'A test category'
      })
      .returning()
      .execute();

    // Create a post but filter for non-existent category
    await db.insert(blogPostsTable)
      .values({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        category_id: category[0].id,
        published: true
      })
      .execute();

    const result = await getBlogPosts({ category_id: 999 }); // Non-existent category
    expect(result).toEqual([]);
  });
});