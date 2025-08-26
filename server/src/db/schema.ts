import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enum for order status
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'shipped', 'completed', 'cancelled']);

// Blog Categories table
export const blogCategoriesTable = pgTable('blog_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Blog Tags table
export const blogTagsTable = pgTable('blog_tags', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Blog Posts table
export const blogPostsTable = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  featured_image_url: text('featured_image_url'),
  category_id: integer('category_id').notNull().references(() => blogCategoriesTable.id),
  published: boolean('published').notNull().default(false),
  published_at: timestamp('published_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Blog Post Tags junction table (many-to-many)
export const blogPostTagsTable = pgTable('blog_post_tags', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id').notNull().references(() => blogPostsTable.id, { onDelete: 'cascade' }),
  tag_id: integer('tag_id').notNull().references(() => blogTagsTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Blog Comments table
export const blogCommentsTable = pgTable('blog_comments', {
  id: serial('id').primaryKey(),
  post_id: integer('post_id').notNull().references(() => blogPostsTable.id, { onDelete: 'cascade' }),
  author_name: text('author_name').notNull(),
  author_email: text('author_email').notNull(),
  content: text('content').notNull(),
  approved: boolean('approved').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Books table
export const booksTable = pgTable('books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  author: text('author').notNull(),
  isbn: text('isbn'),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  cover_image_url: text('cover_image_url'),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  published_year: integer('published_year'),
  publisher: text('publisher'),
  available: boolean('available').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Book Orders table
export const bookOrdersTable = pgTable('book_orders', {
  id: serial('id').primaryKey(),
  customer_name: text('customer_name').notNull(),
  customer_email: text('customer_email').notNull(),
  customer_phone: text('customer_phone').notNull(),
  customer_address: text('customer_address').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: orderStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Book Order Items table
export const bookOrderItemsTable = pgTable('book_order_items', {
  id: serial('id').primaryKey(),
  order_id: integer('order_id').notNull().references(() => bookOrdersTable.id, { onDelete: 'cascade' }),
  book_id: integer('book_id').notNull().references(() => booksTable.id),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Subscriptions table
export const subscriptionsTable = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  active: boolean('active').notNull().default(true),
  subscribed_at: timestamp('subscribed_at').defaultNow().notNull(),
  unsubscribed_at: timestamp('unsubscribed_at'),
});

// WhatsApp Contacts table
export const whatsappContactsTable = pgTable('whatsapp_contacts', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  notes: text('notes'),
  active: boolean('active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations

// Blog Categories relations
export const blogCategoriesRelations = relations(blogCategoriesTable, ({ many }) => ({
  posts: many(blogPostsTable),
}));

// Blog Tags relations
export const blogTagsRelations = relations(blogTagsTable, ({ many }) => ({
  postTags: many(blogPostTagsTable),
}));

// Blog Posts relations
export const blogPostsRelations = relations(blogPostsTable, ({ one, many }) => ({
  category: one(blogCategoriesTable, {
    fields: [blogPostsTable.category_id],
    references: [blogCategoriesTable.id],
  }),
  postTags: many(blogPostTagsTable),
  comments: many(blogCommentsTable),
}));

// Blog Post Tags relations
export const blogPostTagsRelations = relations(blogPostTagsTable, ({ one }) => ({
  post: one(blogPostsTable, {
    fields: [blogPostTagsTable.post_id],
    references: [blogPostsTable.id],
  }),
  tag: one(blogTagsTable, {
    fields: [blogPostTagsTable.tag_id],
    references: [blogTagsTable.id],
  }),
}));

// Blog Comments relations
export const blogCommentsRelations = relations(blogCommentsTable, ({ one }) => ({
  post: one(blogPostsTable, {
    fields: [blogCommentsTable.post_id],
    references: [blogPostsTable.id],
  }),
}));

// Books relations
export const booksRelations = relations(booksTable, ({ many }) => ({
  orderItems: many(bookOrderItemsTable),
}));

// Book Orders relations
export const bookOrdersRelations = relations(bookOrdersTable, ({ many }) => ({
  items: many(bookOrderItemsTable),
}));

// Book Order Items relations
export const bookOrderItemsRelations = relations(bookOrderItemsTable, ({ one }) => ({
  order: one(bookOrdersTable, {
    fields: [bookOrderItemsTable.order_id],
    references: [bookOrdersTable.id],
  }),
  book: one(booksTable, {
    fields: [bookOrderItemsTable.book_id],
    references: [booksTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  blogCategories: blogCategoriesTable,
  blogTags: blogTagsTable,
  blogPosts: blogPostsTable,
  blogPostTags: blogPostTagsTable,
  blogComments: blogCommentsTable,
  books: booksTable,
  bookOrders: bookOrdersTable,
  bookOrderItems: bookOrderItemsTable,
  subscriptions: subscriptionsTable,
  whatsappContacts: whatsappContactsTable,
};