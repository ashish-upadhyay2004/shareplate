import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useComplaints, ComplaintType } from '@/hooks/useComplaints';
import { AlertTriangle } from 'lucide-react';

interface ComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toUserId: string;
  toUserName: string;
  listingId?: string;
}

const complaintTypes: { value: ComplaintType; label: string }[] = [
  { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
  { value: 'food_quality', label: 'Food Quality Issue' },
  { value: 'no_show', label: 'No Show' },
  { value: 'communication', label: 'Communication Issue' },
  { value: 'safety', label: 'Safety Concern' },
  { value: 'other', label: 'Other' },
];

export const ComplaintDialog = ({
  open,
  onOpenChange,
  toUserId,
  toUserName,
  listingId,
}: ComplaintDialogProps) => {
  const [type, setType] = useState<ComplaintType>('other');
  const [description, setDescription] = useState('');
  const { createComplaint, isCreating } = useComplaints();

  const handleSubmit = async () => {
    if (!description.trim()) return;

    await createComplaint({
      to_user_id: toUserId,
      listing_id: listingId,
      type,
      description: description.trim(),
    });

    setType('other');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Report Issue
          </DialogTitle>
          <DialogDescription>
            Report an issue with <strong>{toUserName}</strong>. Our team will review your complaint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type">Issue Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ComplaintType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {complaintTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe the issue in detail..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating || !description.trim()}
          >
            {isCreating ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
