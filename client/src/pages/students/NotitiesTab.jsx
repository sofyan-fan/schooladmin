import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import format from 'date-fns/format';
import { nl } from 'date-fns/locale';
import { Notebook } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NotitiesTab({
  notes = [],
  isLoading = false,
  canPublish = false,
  onAddNote,
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!canPublish || typeof onAddNote !== 'function') {
      return;
    }

    const trimmedText = (text || '').trim();
    const trimmedSubject = (subject || '').trim();
    if (!trimmedText) return;

    try {
      setIsSubmitting(true);
      await onAddNote({ subject: trimmedSubject, text: trimmedText });
      setSubject('');
      setText('');
      setIsDialogOpen(false);
      toast.success('Notitie gepubliceerd.');
    } catch (err) {
      console.error('Failed to publish note:', err);
      toast.error('Kon notitie niet publiceren. Probeer opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <Notebook className="h-5 w-5" />
              Notities
            </CardTitle>
            <CardDescription>
              Alleen zichtbaar voor de docent die het schreef en de leerling.
            </CardDescription>
          </div>

          {canPublish && typeof onAddNote === 'function' ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  Nieuwe notitie
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                  <DialogTitle>Nieuwe notitie</DialogTitle>
                  <DialogDescription>
                    Publiceer een notitie voor deze leerling. Alleen jij en de
                    leerling kunnen deze notitie bekijken.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="note-subject">Onderwerp</Label>
                    <Input
                      id="note-subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Bijv. Huiswerk, gedrag, voortgang"
                      maxLength={191}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note-text">Notitie</Label>
                    <Textarea
                      id="note-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={6}
                      placeholder="Schrijf hier je notitie..."
                      maxLength={191}
                      disabled={isSubmitting}
                    />
                    <div className="text-xs text-muted-foreground">
                      Maximaal 191 tekens.
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Annuleren
                    </Button>
                    <Button
                      type="submit"
                      disabled={!text.trim() || isSubmitting}
                    >
                      Publiceren
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Notities laden…</p>
        ) : (notes || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Er zijn nog geen notities.
          </p>
        ) : (
          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-2">
            {notes.map((note) => {
              const createdAt = note?.created_at || note?.createdAt;
              const dateLabel = createdAt
                ? format(new Date(createdAt), 'dd-MM-yyyy HH:mm', {
                  locale: nl,
                })
                : null;

              return (
                <div
                  key={note.id}
                  className="border rounded-lg p-4 bg-white/60 flex flex-col gap-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-regular">
                      {note.subject || 'Notitie'}
                    </h3>
                    {dateLabel ? (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {dateLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-regular whitespace-pre-wrap">
                    {note.text}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



