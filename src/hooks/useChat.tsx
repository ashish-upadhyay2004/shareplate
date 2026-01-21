import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SenderProfile {
  name: string;
  org_name: string | null;
}

export interface ChatMessage {
  id: string;
  listing_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender_profile?: SenderProfile;
}

export const useChat = (listingId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeMessages, setRealtimeMessages] = useState<ChatMessage[]>([]);

  const messagesQuery = useQuery({
    queryKey: ['chat-messages', listingId],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get sender profiles
      const senderIds = [...new Set(messages.map(m => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, org_name')
        .in('user_id', senderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);

      return messages.map(message => ({
        ...message,
        sender_profile: profileMap.get(message.sender_id) as SenderProfile | undefined,
      })) as ChatMessage[];
    },
    enabled: !!listingId && !!user,
  });

  // Set up realtime subscription
  useEffect(() => {
    if (!listingId || !user) return;

    const channel = supabase
      .channel(`chat-${listingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `listing_id=eq.${listingId}`,
        },
        async (payload) => {
          // Fetch the sender profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, org_name')
            .eq('user_id', payload.new.sender_id)
            .maybeSingle();

          const newMessage: ChatMessage = {
            id: payload.new.id,
            listing_id: payload.new.listing_id,
            sender_id: payload.new.sender_id,
            message: payload.new.message,
            created_at: payload.new.created_at,
            sender_profile: profile as SenderProfile | undefined,
          };

          setRealtimeMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [listingId, user]);

  // Merge query data with realtime messages
  const allMessages = [
    ...(messagesQuery.data ?? []),
    ...realtimeMessages.filter(
      rm => !messagesQuery.data?.some(m => m.id === rm.id)
    ),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          listing_id: listingId,
          sender_id: user.id,
          message,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Clear realtime messages and refetch to get consistent data
      setRealtimeMessages([]);
      queryClient.invalidateQueries({ queryKey: ['chat-messages', listingId] });
    },
  });

  return {
    messages: allMessages,
    isLoading: messagesQuery.isLoading,
    sendMessage: sendMessageMutation.mutateAsync,
    isSending: sendMessageMutation.isPending,
  };
};
