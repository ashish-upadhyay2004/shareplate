import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useListings, DonationListing } from '@/hooks/useListings';
import { useChat } from '@/hooks/useChat';
import { format } from 'date-fns';
import { 
  ArrowLeft, 
  Send, 
  Phone, 
  Video,
  MoreVertical,
  Package,
  Loader2
} from 'lucide-react';

const ChatPage = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { user, profile, role } = useAuth();
  const { getListingById } = useListings();
  const { messages, sendMessage, isLoading: isChatLoading, isSending } = useChat(listingId || '');
  
  const [listing, setListing] = useState<DonationListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!listingId) return;
      const data = await getListingById(listingId);
      setListing(data);
      setIsLoading(false);
    };
    fetchListing();
  }, [listingId, getListingById]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !listingId) return;
    
    await sendMessage(newMessage);
    setNewMessage('');
  };

  if (isLoading || isChatLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Chat Not Found</h1>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Layout>
    );
  }

  // Determine the other party based on role
  const otherPartyName = role === 'donor' 
    ? 'NGO' // In a real app, we'd get this from the accepted request
    : listing.donor_profile?.org_name || listing.donor_profile?.name || 'Donor';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-4 max-w-3xl h-[calc(100vh-5rem)] flex flex-col">
        {/* Header */}
        <Card className="glass-card mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {otherPartyName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{otherPartyName}</h2>
                  <p className="text-xs text-muted-foreground">
                    Re: {listing.food_category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-primary">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-primary">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="glass-card flex-1 overflow-hidden flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="mb-2">No messages yet</p>
                  <p className="text-sm">Start the conversation!</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isOwn = message.sender_id === user?.id;
                  return (
                    <div 
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                        {!isOwn && (
                          <p className="text-xs text-muted-foreground mb-1 ml-1">
                            {message.sender_profile?.name || 'Unknown'}
                          </p>
                        )}
                        <div className={`rounded-2xl px-4 py-2.5 ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-muted rounded-bl-md'
                        }`}>
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <p className={`text-xs text-muted-foreground mt-1 ${isOwn ? 'text-right mr-1' : 'ml-1'}`}>
                          {format(new Date(message.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newMessage.trim() || isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <div className="flex gap-2 mt-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setNewMessage("I'm on my way for pickup!")}
              >
                🚗 On my way
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setNewMessage("Thank you so much for this donation!")}
              >
                🙏 Thank you
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs"
                onClick={() => setNewMessage("The food has been picked up successfully!")}
              >
                ✅ Picked up
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ChatPage;
