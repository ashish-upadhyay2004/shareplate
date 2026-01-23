import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationSettings = () => {
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Your browser doesn't support push notifications
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified about new requests and messages even when you're not on the site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed 
                ? 'You will receive browser notifications' 
                : 'Enable to stay updated'}
            </p>
          </div>
          <Button
            variant={isSubscribed ? 'outline' : 'default'}
            onClick={isSubscribed ? unsubscribe : subscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSubscribed ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Disable
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enable
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
