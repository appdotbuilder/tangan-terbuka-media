import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import all schemas
import {
  createBlogCategoryInputSchema,
  createBlogTagInputSchema,
  createBlogPostInputSchema,
  updateBlogPostInputSchema,
  createBlogCommentInputSchema,
  createBookInputSchema,
  updateBookInputSchema,
  createBookOrderInputSchema,
  updateBookOrderStatusInputSchema,
  createSubscriptionInputSchema,
  createWhatsappContactInputSchema,
  getBlogPostsInputSchema,
  getBooksInputSchema,
  getBookOrdersInputSchema
} from './schema';

// Import all handlers
import { createBlogCategory } from './handlers/create_blog_category';
import { getBlogCategories } from './handlers/get_blog_categories';
import { createBlogTag } from './handlers/create_blog_tag';
import { getBlogTags } from './handlers/get_blog_tags';
import { createBlogPost } from './handlers/create_blog_post';
import { getBlogPosts } from './handlers/get_blog_posts';
import { getBlogPostBySlug } from './handlers/get_blog_post_by_slug';
import { updateBlogPost } from './handlers/update_blog_post';
import { createBlogComment } from './handlers/create_blog_comment';
import { getBlogComments } from './handlers/get_blog_comments';
import { approveBlogComment } from './handlers/approve_blog_comment';
import { createBook } from './handlers/create_book';
import { getBooks } from './handlers/get_books';
import { getBookById } from './handlers/get_book_by_id';
import { updateBook } from './handlers/update_book';
import { createBookOrder } from './handlers/create_book_order';
import { getBookOrders } from './handlers/get_book_orders';
import { getBookOrderById } from './handlers/get_book_order_by_id';
import { updateBookOrderStatus } from './handlers/update_book_order_status';
import { createSubscription } from './handlers/create_subscription';
import { getSubscriptions } from './handlers/get_subscriptions';
import { unsubscribeEmail } from './handlers/unsubscribe_email';
import { createWhatsappContact } from './handlers/create_whatsapp_contact';
import { getWhatsappContacts } from './handlers/get_whatsapp_contacts';
import { deactivateWhatsappContact } from './handlers/deactivate_whatsapp_contact';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Blog Category routes
  createBlogCategory: publicProcedure
    .input(createBlogCategoryInputSchema)
    .mutation(({ input }) => createBlogCategory(input)),
  getBlogCategories: publicProcedure
    .query(() => getBlogCategories()),

  // Blog Tag routes
  createBlogTag: publicProcedure
    .input(createBlogTagInputSchema)
    .mutation(({ input }) => createBlogTag(input)),
  getBlogTags: publicProcedure
    .query(() => getBlogTags()),

  // Blog Post routes
  createBlogPost: publicProcedure
    .input(createBlogPostInputSchema)
    .mutation(({ input }) => createBlogPost(input)),
  getBlogPosts: publicProcedure
    .input(getBlogPostsInputSchema.optional())
    .query(({ input }) => getBlogPosts(input)),
  getBlogPostBySlug: publicProcedure
    .input(z.string())
    .query(({ input }) => getBlogPostBySlug(input)),
  updateBlogPost: publicProcedure
    .input(updateBlogPostInputSchema)
    .mutation(({ input }) => updateBlogPost(input)),

  // Blog Comment routes
  createBlogComment: publicProcedure
    .input(createBlogCommentInputSchema)
    .mutation(({ input }) => createBlogComment(input)),
  getBlogComments: publicProcedure
    .input(z.object({ 
      postId: z.number(), 
      approvedOnly: z.boolean().optional().default(true) 
    }))
    .query(({ input }) => getBlogComments(input.postId, input.approvedOnly)),
  approveBlogComment: publicProcedure
    .input(z.number())
    .mutation(({ input }) => approveBlogComment(input)),

  // Book routes
  createBook: publicProcedure
    .input(createBookInputSchema)
    .mutation(({ input }) => createBook(input)),
  getBooks: publicProcedure
    .input(getBooksInputSchema.optional())
    .query(({ input }) => getBooks(input)),
  getBookById: publicProcedure
    .input(z.number())
    .query(({ input }) => getBookById(input)),
  updateBook: publicProcedure
    .input(updateBookInputSchema)
    .mutation(({ input }) => updateBook(input)),

  // Book Order routes
  createBookOrder: publicProcedure
    .input(createBookOrderInputSchema)
    .mutation(({ input }) => createBookOrder(input)),
  getBookOrders: publicProcedure
    .input(getBookOrdersInputSchema.optional())
    .query(({ input }) => getBookOrders(input)),
  getBookOrderById: publicProcedure
    .input(z.number())
    .query(({ input }) => getBookOrderById(input)),
  updateBookOrderStatus: publicProcedure
    .input(updateBookOrderStatusInputSchema)
    .mutation(({ input }) => updateBookOrderStatus(input)),

  // Subscription routes
  createSubscription: publicProcedure
    .input(createSubscriptionInputSchema)
    .mutation(({ input }) => createSubscription(input)),
  getSubscriptions: publicProcedure
    .input(z.boolean().optional().default(true))
    .query(({ input }) => getSubscriptions(input)),
  unsubscribeEmail: publicProcedure
    .input(z.string().email())
    .mutation(({ input }) => unsubscribeEmail(input)),

  // WhatsApp Contact routes
  createWhatsappContact: publicProcedure
    .input(createWhatsappContactInputSchema)
    .mutation(({ input }) => createWhatsappContact(input)),
  getWhatsappContacts: publicProcedure
    .input(z.boolean().optional().default(true))
    .query(({ input }) => getWhatsappContacts(input)),
  deactivateWhatsappContact: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deactivateWhatsappContact(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();