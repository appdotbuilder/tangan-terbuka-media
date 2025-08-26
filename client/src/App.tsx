import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  BlogPost, 
  BlogCategory, 
  BlogTag, 
  Book, 
  CreateSubscriptionInput,
  CreateWhatsappContactInput 
} from '../../server/src/schema';
import { BlogSection } from '@/components/BlogSection';
import { BookSection } from '@/components/BookSection';
import { SubscriptionForm } from '@/components/SubscriptionForm';
import { WhatsAppForm } from '@/components/WhatsAppForm';
import { MediaWidgets } from '@/components/MediaWidgets';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-2 border-sky-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">🤲</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-sky-900">Tangan Terbuka Media</h1>
                <p className="text-sky-600 text-sm">Blog & Bookstore</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Button variant="ghost" className="text-sky-700 hover:text-sky-900 hover:bg-sky-100">
                📝 Blog
              </Button>
              <Button variant="ghost" className="text-sky-700 hover:text-sky-900 hover:bg-sky-100">
                📚 Books
              </Button>
              <Button variant="ghost" className="text-sky-700 hover:text-sky-900 hover:bg-sky-100">
                📻 Media
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="blog" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-white shadow-sm">
            <TabsTrigger 
              value="blog" 
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              📝 Blog
            </TabsTrigger>
            <TabsTrigger 
              value="books" 
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              📚 Books
            </TabsTrigger>
            <TabsTrigger 
              value="media" 
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              📻 Media
            </TabsTrigger>
            <TabsTrigger 
              value="subscribe" 
              className="data-[state=active]:bg-sky-500 data-[state=active]:text-white"
            >
              📧 Subscribe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="blog">
            <BlogSection />
          </TabsContent>

          <TabsContent value="books">
            <BookSection />
          </TabsContent>

          <TabsContent value="media">
            <MediaWidgets />
          </TabsContent>

          <TabsContent value="subscribe">
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="border-sky-200 shadow-lg">
                <CardHeader className="bg-sky-50">
                  <CardTitle className="text-sky-900 flex items-center">
                    📧 Newsletter Subscription
                  </CardTitle>
                  <CardDescription className="text-sky-600">
                    Get the latest blog posts delivered to your inbox
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <SubscriptionForm />
                </CardContent>
              </Card>

              <Card className="border-sky-200 shadow-lg">
                <CardHeader className="bg-sky-50">
                  <CardTitle className="text-sky-900 flex items-center">
                    📱 WhatsApp Updates
                  </CardTitle>
                  <CardDescription className="text-sky-600">
                    Join our WhatsApp list for exclusive updates and news
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <WhatsAppForm />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-sky-900 text-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                🤲 Tangan Terbuka Media
              </h3>
              <p className="text-sky-200">
                Sharing knowledge through blogs and books. Opening hands, opening minds.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sky-200">
                <li>📝 Latest Posts</li>
                <li>📚 New Books</li>
                <li>📻 Media Center</li>
                <li>📧 Newsletter</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect With Us</h4>
              <div className="space-y-2 text-sky-200">
                <p>📱 WhatsApp Updates</p>
                <p>📧 Newsletter</p>
                <p>📻 Live Radio</p>
                <p>🎵 Spotify Playlist</p>
              </div>
            </div>
          </div>
          <Separator className="my-8 bg-sky-800" />
          <div className="text-center text-sky-200">
            <p>&copy; 2024 Tangan Terbuka Media. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;