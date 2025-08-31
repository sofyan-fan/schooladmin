import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import {
  BookOpen,
  Calendar,
  Clock,
  GraduationCap,
  Hash,
  Scale,
  Target,
} from 'lucide-react';

export default function ViewAssessmentModal({
  open,
  onOpenChange,
  assessment,
  type = 'test',
}) {
  if (!assessment) return null;

  const formatDate = (dateString) => {
    try {
      return format(parseISO(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  const InfoRow = ({ icon: Icon, label, value, className = '' }) => (
    <div className="flex items-start space-x-3">
      <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-medium ${className}`}>{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{assessment.name}</DialogTitle>
            <Badge variant={type === 'exam' ? 'default' : 'secondary'}>
              {type === 'exam' ? 'Exam' : 'Test'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              BASIC INFORMATION
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={GraduationCap}
                label="Class"
                value={assessment.class}
              />
              <InfoRow
                icon={BookOpen}
                label="Subject"
                value={assessment.subject}
              />
              <InfoRow
                icon={Calendar}
                label="Date"
                value={formatDate(assessment.date)}
              />
              <InfoRow
                icon={Clock}
                label="Duration"
                value={
                  assessment.duration
                    ? `${assessment.duration} minutes`
                    : 'Not specified'
                }
              />
            </div>
          </div>

          <Separator />

          {/* Scoring Information */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              SCORING
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={Target}
                label="Maximum Score"
                value={assessment.maxScore}
                className="text-lg"
              />
              <InfoRow
                icon={Scale}
                label="Weight"
                value={assessment.weight || '1.0'}
                className="text-lg"
              />
            </div>
          </div>

          {/* Description */}
          {assessment.description && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  DESCRIPTION
                </h3>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {assessment.description}
                </p>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              METADATA
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow
                icon={Hash}
                label="Assessment ID"
                value={assessment.id}
              />
              {assessment.createdAt && (
                <InfoRow
                  icon={Calendar}
                  label="Created"
                  value={formatDate(assessment.createdAt)}
                />
              )}
            </div>
          </div>

          {/* Statistics (placeholder for future implementation) */}
          {assessment.statistics && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  STATISTICS
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {assessment.statistics.average || '—'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Average Score
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {assessment.statistics.completed || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold">
                      {assessment.statistics.pending || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
