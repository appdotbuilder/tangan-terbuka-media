import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc } from '@/utils/trpc';
import type { CreateSubscriptionInput } from '../../../server/src/schema';

export function SubscriptionForm() {
  const [formData, setFormData] = useState<CreateSubscriptionInput>({
    email: '',
    name: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createSubscription.mutate(formData);
      setFormData({
        email: '',
        name: null
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000); // Reset success message after 5 seconds
    } catch (error) {
      console.error('Failed to subscribe:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-sky-900 mb-2">Welcome aboard!</h3>
        <p className="text-sky-700">
          Thank you for subscribing to our newsletter. You'll receive the latest blog posts directly in your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <Input
          type="email"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateSubscriptionInput) => ({ 
              ...prev, 
              email: e.target.value 
            }))
          }
          required
          className="border-sky-200 focus:border-sky-500"
        />
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={formData.name || ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateSubscriptionInput) => ({ 
              ...prev, 
              name: e.target.value || null 
            }))
          }
          className="border-sky-200 focus:border-sky-500"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-sky-500 hover:bg-sky-600 text-white"
      >
        {isLoading ? '📧 Subscribing...' : '📧 Subscribe to Newsletter'}
      </Button>
      
      <p className="text-xs text-sky-600 text-center">
        We'll send you the latest blog posts and never spam you. You can unsubscribe anytime.
      </p>
    </form>
  );
}