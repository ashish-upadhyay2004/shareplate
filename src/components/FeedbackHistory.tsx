import { useFeedback, Feedback } from '@/hooks/useFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MessageSquare, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const StarRating = ({ stars }: { stars: number }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i <= stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
      />
    ))}
  </div>
);

const FeedbackCard = ({ feedback, type }: { feedback: Feedback; type: 'given' | 'received' }) => (
  <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {type === 'given' ? (
            <ArrowUpRight className="h-4 w-4 text-blue-500" />
          ) : (
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
          )}
          <span className="font-medium truncate">
            {type === 'given' 
              ? feedback.to_profile?.org_name || feedback.to_profile?.name || 'Unknown User'
              : feedback.from_profile?.org_name || feedback.from_profile?.name || 'Unknown User'
            }
          </span>
        </div>
        <StarRating stars={feedback.stars} />
        {feedback.comment && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{feedback.comment}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(feedback.created_at), 'MMM d, yyyy')}
      </span>
    </div>
  </div>
);

export const FeedbackHistory = () => {
  const { receivedFeedback, givenFeedback, averageRating, isLoading } = useFeedback();

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Feedback & Ratings
            </CardTitle>
            <CardDescription>View your feedback history</CardDescription>
          </div>
          {receivedFeedback.length > 0 && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold">{averageRating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                from {receivedFeedback.length} {receivedFeedback.length === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="received" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="received" className="gap-2">
              <ArrowDownLeft className="h-4 w-4" />
              Received ({receivedFeedback.length})
            </TabsTrigger>
            <TabsTrigger value="given" className="gap-2">
              <ArrowUpRight className="h-4 w-4" />
              Given ({givenFeedback.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4 space-y-3">
            {receivedFeedback.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No feedback received yet</p>
              </div>
            ) : (
              receivedFeedback.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} type="received" />
              ))
            )}
          </TabsContent>

          <TabsContent value="given" className="mt-4 space-y-3">
            {givenFeedback.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">You haven't given any feedback yet</p>
              </div>
            ) : (
              givenFeedback.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} type="given" />
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
