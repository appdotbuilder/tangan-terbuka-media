import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  Book, 
  CreateBookOrderInput 
} from '../../../server/src/schema';

interface OrderItem {
  book_id: number;
  quantity: number;
}

export function BookSection() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<Map<number, number>>(new Map());

  // Order form state
  const [orderForm, setOrderForm] = useState<Omit<CreateBookOrderInput, 'items'>>({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    notes: null
  });

  const loadBooks = useCallback(async () => {
    try {
      const result = await trpc.getBooks.query({ available: true });
      setBooks(result);
    } catch (error) {
      console.error('Failed to load books:', error);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const addToCart = (bookId: number) => {
    setCart((prev: Map<number, number>) => {
      const newCart = new Map(prev);
      const currentQty = newCart.get(bookId) || 0;
      newCart.set(bookId, currentQty + 1);
      return newCart;
    });
  };

  const removeFromCart = (bookId: number) => {
    setCart((prev: Map<number, number>) => {
      const newCart = new Map(prev);
      const currentQty = newCart.get(bookId) || 0;
      if (currentQty <= 1) {
        newCart.delete(bookId);
      } else {
        newCart.set(bookId, currentQty - 1);
      }
      return newCart;
    });
  };

  const getCartTotal = () => {
    let total = 0;
    cart.forEach((quantity: number, bookId: number) => {
      const book = books.find((b: Book) => b.id === bookId);
      if (book) {
        total += book.price * quantity;
      }
    });
    return total;
  };

  const getCartItems = (): OrderItem[] => {
    const items: OrderItem[] = [];
    cart.forEach((quantity: number, bookId: number) => {
      items.push({ book_id: bookId, quantity });
    });
    return items;
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.size === 0) {
      alert('Please add some books to your cart first.');
      return;
    }

    setIsLoading(true);
    try {
      const orderData: CreateBookOrderInput = {
        ...orderForm,
        items: getCartItems()
      };
      
      await trpc.createBookOrder.mutate(orderData);
      
      // Reset form and cart
      setOrderForm({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        customer_address: '',
        notes: null
      });
      setCart(new Map());
      setIsOrderDialogOpen(false);
      
      alert('Order submitted successfully! We will contact you soon to confirm your order.');
    } catch (error) {
      console.error('Failed to submit order:', error);
      alert('Failed to submit order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedBook) {
    return (
      <div className="space-y-6">
        <Button 
          onClick={() => setSelectedBook(null)}
          className="bg-sky-500 hover:bg-sky-600 text-white"
        >
          ← Back to Books
        </Button>

        <Card className="border-sky-200 shadow-lg">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {selectedBook.cover_image_url && (
              <div className="w-full h-96 overflow-hidden rounded-lg">
                <img 
                  src={selectedBook.cover_image_url} 
                  alt={selectedBook.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-sky-900">{selectedBook.title}</h1>
                <p className="text-xl text-sky-700 mt-2">by {selectedBook.author}</p>
              </div>

              <div className="flex items-center space-x-4">
                <Badge 
                  className={selectedBook.available ? 'bg-green-500' : 'bg-red-500'}
                >
                  {selectedBook.available ? '✅ Available' : '❌ Out of Stock'}
                </Badge>
                <span className="text-2xl font-bold text-sky-600">
                  ${selectedBook.price.toFixed(2)}
                </span>
              </div>

              {selectedBook.isbn && (
                <p className="text-sky-600">
                  <strong>ISBN:</strong> {selectedBook.isbn}
                </p>
              )}

              {selectedBook.publisher && (
                <p className="text-sky-600">
                  <strong>Publisher:</strong> {selectedBook.publisher}
                </p>
              )}

              {selectedBook.published_year && (
                <p className="text-sky-600">
                  <strong>Published:</strong> {selectedBook.published_year}
                </p>
              )}

              <p className="text-sky-600">
                <strong>In Stock:</strong> {selectedBook.stock_quantity} copies
              </p>

              {selectedBook.description && (
                <div className="bg-sky-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sky-900 mb-2">📖 Description</h3>
                  <p className="text-sky-700">{selectedBook.description}</p>
                </div>
              )}

              <div className="flex items-center space-x-4 pt-4">
                <Button
                  onClick={() => addToCart(selectedBook.id)}
                  disabled={!selectedBook.available}
                  className="bg-sky-500 hover:bg-sky-600 text-white flex-1"
                >
                  🛒 Add to Cart
                </Button>
                {cart.has(selectedBook.id) && (
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(selectedBook.id)}
                    >
                      -
                    </Button>
                    <span className="text-sky-900 font-semibold px-2">
                      {cart.get(selectedBook.id)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addToCart(selectedBook.id)}
                    >
                      +
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-sky-900">📚 Book Collection</h2>
        
        {cart.size > 0 && (
          <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-sky-500 hover:bg-sky-600 text-white">
                🛒 Cart ({cart.size}) - ${getCartTotal().toFixed(2)}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-sky-900">📦 Complete Your Order</DialogTitle>
                <DialogDescription>
                  Fill in your details to place your order. We'll contact you to confirm.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Cart Summary */}
                <div className="bg-sky-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-sky-900 mb-3">Order Summary</h3>
                  <div className="space-y-2">
                    {Array.from(cart.entries()).map(([bookId, quantity]) => {
                      const book = books.find((b: Book) => b.id === bookId);
                      if (!book) return null;
                      return (
                        <div key={bookId} className="flex justify-between">
                          <span>{book.title} x {quantity}</span>
                          <span>${(book.price * quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex justify-between font-bold text-sky-900">
                      <span>Total:</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Form */}
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Full Name"
                      value={orderForm.customer_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOrderForm((prev) => ({ ...prev, customer_name: e.target.value }))
                      }
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={orderForm.customer_email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setOrderForm((prev) => ({ ...prev, customer_email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <Input
                    placeholder="Phone Number"
                    value={orderForm.customer_phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOrderForm((prev) => ({ ...prev, customer_phone: e.target.value }))
                    }
                    required
                  />
                  <Textarea
                    placeholder="Delivery Address"
                    value={orderForm.customer_address}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setOrderForm((prev) => ({ ...prev, customer_address: e.target.value }))
                    }
                    required
                    rows={3}
                  />
                  <Textarea
                    placeholder="Additional Notes (optional)"
                    value={orderForm.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setOrderForm((prev) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    rows={2}
                  />
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    {isLoading ? 'Placing Order...' : '📦 Place Order'}
                  </Button>
                </form>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {books.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-sky-600 text-lg">No books available yet.</p>
          </div>
        ) : (
          books.map((book: Book) => (
            <Card 
              key={book.id} 
              className="border-sky-200 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              onClick={() => setSelectedBook(book)}
            >
              {book.cover_image_url && (
                <div className="w-full h-48 overflow-hidden rounded-t-lg">
                  <img 
                    src={book.cover_image_url} 
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              <CardHeader className="bg-sky-50">
                <div className="flex items-center justify-between">
                  <Badge 
                    className={book.available ? 'bg-green-500' : 'bg-red-500'}
                  >
                    {book.available ? '✅ Available' : '❌ Out of Stock'}
                  </Badge>
                  <span className="text-sky-900 font-bold">
                    ${book.price.toFixed(2)}
                  </span>
                </div>
                <CardTitle className="text-sky-900 group-hover:text-sky-600 transition-colors line-clamp-2">
                  {book.title}
                </CardTitle>
                <CardDescription className="text-sky-700">
                  by {book.author}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sky-600 text-sm">
                    📦 {book.stock_quantity} in stock
                  </span>
                  {book.published_year && (
                    <span className="text-sky-600 text-sm">
                      {book.published_year}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    className="flex-1 text-sky-600 hover:text-sky-800 hover:bg-sky-100"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setSelectedBook(book);
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      addToCart(book.id);
                    }}
                    disabled={!book.available}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                  >
                    🛒
                  </Button>
                  {cart.has(book.id) && (
                    <Badge className="bg-sky-500 text-white">
                      {cart.get(book.id)}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}