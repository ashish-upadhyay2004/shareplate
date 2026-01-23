import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useFeedback } from '@/hooks/useFeedback';

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  toUserId: string;
  toUserName: string;
}

export const FeedbackDialog = ({
  open,
  onOpenChange,
  listingId,
  toUserId,
  toUserName,
}: FeedbackDialogProps) => {
  const [stars, setStars] = useState(0);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [comment, setComment] = useState('');
  const { createFeedback, isCreating, hasFeedbackForListing } = useFeedback();
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    const checkFeedback = async () => {
      const hasSubmitted = await hasFeedbackForListing(listingId);
      setAlreadySubmitted(hasSubmitted);
    };
    if (open) {
      checkFeedback();
    }
  }, [open, listingId, hasFeedbackForListing]);

  const handleSubmit = async () => {
    if (stars === 0) return;

    await createFeedback({
      listing_id: listingId,
      to_user_id: toUserId,
      stars,
      comment: comment || undefined,
    });

    setStars(0);
    setComment('');
    onOpenChange(false);
  };

  if (alreadySubmitted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Feedback Already Submitted</DialogTitle>
            <DialogDescription>
              You have already submitted feedback for this donation. Thank you!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with {toUserName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="p-1 transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredStars(value)}
                  onMouseLeave={() => setHoveredStars(0)}
                  onClick={() => setStars(value)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      value <= (hoveredStars || stars)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {stars > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                {stars === 1 && 'Poor'}
                {stars === 2 && 'Fair'}
                {stars === 3 && 'Good'}
                {stars === 4 && 'Very Good'}
                {stars === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={stars === 0 || isCreating}>
            {isCreating ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
