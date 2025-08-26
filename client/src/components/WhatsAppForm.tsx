import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { CreateWhatsappContactInput } from '../../../server/src/schema';

export function WhatsAppForm() {
  const [formData, setFormData] = useState<CreateWhatsappContactInput>({
    name: '',
    phone: '',
    notes: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createWhatsappContact.mutate(formData);
      setFormData({
        name: '',
        phone: '',
        notes: null
      });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000); // Reset success message after 5 seconds
    } catch (error) {
      console.error('Failed to add WhatsApp contact:', error);
      alert('Failed to add contact. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Format as +XX XXXX XXXX XXXX
    if (digits.length <= 2) return `+${digits}`;
    if (digits.length <= 6) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
    if (digits.length <= 10) return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    return `+${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)} ${digits.slice(10, 14)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData((prev: CreateWhatsappContactInput) => ({ 
      ...prev, 
      phone: formatted 
    }));
  };

  if (isSuccess) {
    return (
      <div className="text-center py-8">
        <div className="text-6xl mb-4">💚</div>
        <h3 className="text-xl font-bold text-sky-900 mb-2">You're on the list!</h3>
        <p className="text-sky-700">
          Thank you for joining our WhatsApp updates. You'll receive exclusive news and updates directly to your phone.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <Input
          type="text"
          placeholder="Your full name"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFormData((prev: CreateWhatsappContactInput) => ({ 
              ...prev, 
              name: e.target.value 
            }))
          }
          required
          className="border-sky-200 focus:border-sky-500"
        />
        <Input
          type="tel"
          placeholder="+62 8123 4567 890"
          value={formData.phone}
          onChange={handlePhoneChange}
          required
          className="border-sky-200 focus:border-sky-500"
        />
        <Textarea
          placeholder="How did you hear about us? (optional)"
          value={formData.notes || ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setFormData((prev: CreateWhatsappContactInput) => ({ 
              ...prev, 
              notes: e.target.value || null 
            }))
          }
          rows={3}
          className="border-sky-200 focus:border-sky-500"
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full bg-green-500 hover:bg-green-600 text-white"
      >
        {isLoading ? '📱 Adding...' : '📱 Join WhatsApp Updates'}
      </Button>
      
      <p className="text-xs text-sky-600 text-center">
        We'll send you exclusive updates and never spam. You can opt out anytime by replying STOP.
      </p>
    </form>
  );
}