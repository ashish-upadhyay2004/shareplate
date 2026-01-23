import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EmailType = 'request_received' | 'request_accepted' | 'request_rejected' | 'pickup_reminder' | 'donation_completed';

interface SendEmailParams {
  type: EmailType;
  to_email: string;
  to_name: string;
  listing_title?: string;
  donor_name?: string;
  ngo_name?: string;
  pickup_time?: string;
  message?: string;
}

export const useEmailNotifications = () => {
  const sendEmail = useCallback(async (params: SendEmailParams) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: params,
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }
  }, []);

  const sendPushNotification = useCallback(async (userId: string, title: string, body: string, url?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-push', {
        body: { user_id: userId, title, body, url },
      });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error };
    }
  }, []);

  return { sendEmail, sendPushNotification };
};
