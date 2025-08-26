import { z } from 'zod';

// Blog Category schema
export const blogCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type BlogCategory = z.infer<typeof blogCategorySchema>;

// Blog Tag schema
export const blogTagSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  created_at: z.coerce.date()
});

export type BlogTag = z.infer<typeof blogTagSchema>;

// Blog Post schema
export const blogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  featured_image_url: z.string().nullable(),
  category_id: z.number(),
  published: z.boolean(),
  published_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// Blog Comment schema
export const blogCommentSchema = z.object({
  id: z.number(),
  post_id: z.number(),
  author_name: z.string(),
  author_email: z.string(),
  content: z.string(),
  approved: z.boolean(),
  created_at: z.coerce.date()
});

export type BlogComment = z.infer<typeof blogCommentSchema>;

// Book schema
export const bookSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  isbn: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number(),
  cover_image_url: z.string().nullable(),
  stock_quantity: z.number().int(),
  published_year: z.number().int().nullable(),
  publisher: z.string().nullable(),
  available: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Book = z.infer<typeof bookSchema>;

// Book Order schema
export const bookOrderSchema = z.object({
  id: z.number(),
  customer_name: z.string(),
  customer_email: z.string(),
  customer_phone: z.string(),
  customer_address: z.string(),
  total_amount: z.number(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'completed', 'cancelled']),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BookOrder = z.infer<typeof bookOrderSchema>;

// Book Order Item schema
export const bookOrderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  book_id: z.number(),
  quantity: z.number().int(),
  price: z.number(),
  created_at: z.coerce.date()
});

export type BookOrderItem = z.infer<typeof bookOrderItemSchema>;

// Subscription schema
export const subscriptionSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string().nullable(),
  active: z.boolean(),
  subscribed_at: z.coerce.date(),
  unsubscribed_at: z.coerce.date().nullable()
});

export type Subscription = z.infer<typeof subscriptionSchema>;

// WhatsApp Contact schema
export const whatsappContactSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  notes: z.string().nullable(),
  active: z.boolean(),
  created_at: z.coerce.date()
});

export type WhatsappContact = z.infer<typeof whatsappContactSchema>;

// Input schemas for creating data

// Create Blog Category
export const createBlogCategoryInputSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable()
});

export type CreateBlogCategoryInput = z.infer<typeof createBlogCategoryInputSchema>;

// Create Blog Tag
export const createBlogTagInputSchema = z.object({
  name: z.string(),
  slug: z.string()
});

export type CreateBlogTagInput = z.infer<typeof createBlogTagInputSchema>;

// Create Blog Post
export const createBlogPostInputSchema = z.object({
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().nullable(),
  featured_image_url: z.string().nullable(),
  category_id: z.number(),
  published: z.boolean(),
  tag_ids: z.array(z.number()).optional()
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostInputSchema>;

// Create Blog Comment
export const createBlogCommentInputSchema = z.object({
  post_id: z.number(),
  author_name: z.string(),
  author_email: z.string().email(),
  content: z.string()
});

export type CreateBlogCommentInput = z.infer<typeof createBlogCommentInputSchema>;

// Create Book
export const createBookInputSchema = z.object({
  title: z.string(),
  author: z.string(),
  isbn: z.string().nullable(),
  description: z.string().nullable(),
  price: z.number().positive(),
  cover_image_url: z.string().nullable(),
  stock_quantity: z.number().int().nonnegative(),
  published_year: z.number().int().nullable(),
  publisher: z.string().nullable(),
  available: z.boolean()
});

export type CreateBookInput = z.infer<typeof createBookInputSchema>;

// Create Book Order
export const createBookOrderInputSchema = z.object({
  customer_name: z.string(),
  customer_email: z.string().email(),
  customer_phone: z.string(),
  customer_address: z.string(),
  items: z.array(z.object({
    book_id: z.number(),
    quantity: z.number().int().positive()
  })),
  notes: z.string().nullable()
});

export type CreateBookOrderInput = z.infer<typeof createBookOrderInputSchema>;

// Create Subscription
export const createSubscriptionInputSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable()
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionInputSchema>;

// Create WhatsApp Contact
export const createWhatsappContactInputSchema = z.object({
  name: z.string(),
  phone: z.string(),
  notes: z.string().nullable()
});

export type CreateWhatsappContactInput = z.infer<typeof createWhatsappContactInputSchema>;

// Update schemas

// Update Blog Post
export const updateBlogPostInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  featured_image_url: z.string().nullable().optional(),
  category_id: z.number().optional(),
  published: z.boolean().optional(),
  tag_ids: z.array(z.number()).optional()
});

export type UpdateBlogPostInput = z.infer<typeof updateBlogPostInputSchema>;

// Update Book
export const updateBookInputSchema = z.object({
  id: z.number(),
  title: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  cover_image_url: z.string().nullable().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  published_year: z.number().int().nullable().optional(),
  publisher: z.string().nullable().optional(),
  available: z.boolean().optional()
});

export type UpdateBookInput = z.infer<typeof updateBookInputSchema>;

// Update Book Order Status
export const updateBookOrderStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'completed', 'cancelled'])
});

export type UpdateBookOrderStatusInput = z.infer<typeof updateBookOrderStatusInputSchema>;

// Query schemas

// Get Blog Posts with filters
export const getBlogPostsInputSchema = z.object({
  category_id: z.number().optional(),
  tag_id: z.number().optional(),
  published: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetBlogPostsInput = z.infer<typeof getBlogPostsInputSchema>;

// Get Books with filters
export const getBooksInputSchema = z.object({
  available: z.boolean().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetBooksInput = z.infer<typeof getBooksInputSchema>;

// Get Book Orders with filters
export const getBookOrdersInputSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'shipped', 'completed', 'cancelled']).optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetBookOrdersInput = z.infer<typeof getBookOrdersInputSchema>;