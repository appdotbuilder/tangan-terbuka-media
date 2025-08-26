import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  BlogPost, 
  BlogCategory, 
  BlogTag, 
  BlogComment,
  CreateBlogCommentInput 
} from '../../../server/src/schema';

export function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Comment form state
  const [commentForm, setCommentForm] = useState<CreateBlogCommentInput>({
    post_id: 0,
    author_name: '',
    author_email: '',
    content: ''
  });

  const loadPosts = useCallback(async () => {
    try {
      const filters = selectedCategory !== 'all' ? { 
        category_id: parseInt(selectedCategory),
        published: true 
      } : { published: true };
      const result = await trpc.getBlogPosts.query(filters);
      setPosts(result);
    } catch (error) {
      console.error('Failed to load posts:', error);
    }
  }, [selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getBlogCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadTags = useCallback(async () => {
    try {
      const result = await trpc.getBlogTags.query();
      setTags(result);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, []);

  const loadComments = useCallback(async (postId: number) => {
    try {
      const result = await trpc.getBlogComments.query({ 
        postId, 
        approvedOnly: true 
      });
      setComments(result);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    loadCategories();
    loadTags();
  }, [loadPosts, loadCategories, loadTags]);

  const handlePostClick = async (post: BlogPost) => {
    setSelectedPost(post);
    setCommentForm((prev: CreateBlogCommentInput) => ({ ...prev, post_id: post.id }));
    await loadComments(post.id);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createBlogComment.mutate(commentForm);
      setCommentForm((prev: CreateBlogCommentInput) => ({
        ...prev,
        author_name: '',
        author_email: '',
        content: ''
      }));
      // Show success message
      alert('Comment submitted successfully! It will appear after approval.');
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert('Failed to submit comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find((cat: BlogCategory) => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  if (selectedPost) {
    return (
      <div className="space-y-6">
        <Button 
          onClick={() => setSelectedPost(null)}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          ← Back to Posts
        </Button>

        <Card className="border-sky-200 shadow-lg">
          <CardHeader className="bg-sky-50">
            <div className="flex items-center justify-between">
              <Badge className="bg-sky-500 text-white">
                {getCategoryName(selectedPost.category_id)}
              </Badge>
              <span className="text-sky-600 text-sm">
                {selectedPost.published_at?.toLocaleDateString()}
              </span>
            </div>
            <CardTitle className="text-2xl text-sky-900 mt-4">
              {selectedPost.title}
            </CardTitle>
            {selectedPost.excerpt && (
              <CardDescription className="text-sky-700 text-lg">
                {selectedPost.excerpt}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {selectedPost.featured_image_url && (
              <img 
                src={selectedPost.featured_image_url} 
                alt={selectedPost.title}
                className="w-full h-64 object-cover rounded-lg mb-6"
              />
            )}
            <div className="prose max-w-none text-gray-700">
              {selectedPost.content.split('\n').map((paragraph: string, index: number) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card className="border-sky-200 shadow-lg">
          <CardHeader className="bg-sky-50">
            <CardTitle className="text-sky-900">💬 Comments ({comments.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-sky-600">No comments yet. Be the first to comment!</p>
              ) : (
                comments.map((comment: BlogComment) => (
                  <div key={comment.id} className="border-l-4 border-sky-200 pl-4 py-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sky-900">{comment.author_name}</span>
                      <span className="text-sky-600 text-sm">
                        {comment.created_at.toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <Separator className="mb-6" />

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-4">
              <h3 className="text-lg font-semibold text-sky-900">Leave a Comment</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="Your Name"
                  value={commentForm.author_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCommentForm((prev: CreateBlogCommentInput) => ({ 
                      ...prev, 
                      author_name: e.target.value 
                    }))
                  }
                  required
                />
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={commentForm.author_email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCommentForm((prev: CreateBlogCommentInput) => ({ 
                      ...prev, 
                      author_email: e.target.value 
                    }))
                  }
                  required
                />
              </div>
              <Textarea
                placeholder="Write your comment..."
                value={commentForm.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setCommentForm((prev: CreateBlogCommentInput) => ({ 
                    ...prev, 
                    content: e.target.value 
                  }))
                }
                required
                rows={4}
              />
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                {isLoading ? 'Submitting...' : '💬 Post Comment'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-sky-900">📝 Latest Blog Posts</h2>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: BlogCategory) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-sky-600 text-lg">No blog posts available yet.</p>
          </div>
        ) : (
          posts.map((post: BlogPost) => (
            <Card 
              key={post.id} 
              className="border-sky-200 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => handlePostClick(post)}
            >
              {post.featured_image_url && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={post.featured_image_url} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <CardHeader className="bg-sky-50">
                <div className="flex items-center justify-between">
                  <Badge className="bg-sky-500 text-white">
                    {getCategoryName(post.category_id)}
                  </Badge>
                  <span className="text-sky-600 text-sm">
                    {post.published_at?.toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-sky-900 group-hover:text-sky-600 transition-colors">
                  {post.title}
                </CardTitle>
                {post.excerpt && (
                  <CardDescription className="text-sky-700">
                    {post.excerpt}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <Button 
                  variant="ghost" 
                  className="w-full text-sky-600 hover:text-sky-800 hover:bg-sky-100"
                >
                  Read More →
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}