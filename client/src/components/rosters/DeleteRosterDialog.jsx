import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const DeleteRosterDialog = ({ open, onOpenChange, onConfirm, roster }) => {
  if (!roster) return null;

  const formatTime = (time) => {
    return time ? time.slice(0, 5) : '';
  };

  const dayLabels = {
    Monday: 'Maandag',
    Tuesday: 'Dinsdag',
    Wednesday: 'Woensdag',
    Thursday: 'Donderdag',
    Friday: 'Vrijdag',
    Saturday: 'Zaterdag',
    Sunday: 'Zondag',
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rooster Verwijderen</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                Weet je zeker dat je dit rooster item wilt verwijderen? Deze
                actie kan niet ongedaan gemaakt worden.
              </p>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="text-sm space-y-1">
                  <p>
                    <strong>Klas:</strong>{' '}
                    {roster.class_layout?.name || 'Geen klas'}
                  </p>
                  <p>
                    <strong>Vak:</strong> {roster.subject?.name || 'Geen vak'}
                  </p>
                  <p>
                    <strong>Docent:</strong>{' '}
                    {roster.teacher
                      ? `${roster.teacher.first_name} ${roster.teacher.last_name}`
                      : 'Geen docent'}
                  </p>
                  <p>
                    <strong>Dag:</strong>{' '}
                    {dayLabels[roster.day_of_week] || roster.day_of_week}
                  </p>
                  <p>
                    <strong>Tijd:</strong> {formatTime(roster.start_time)} -{' '}
                    {formatTime(roster.end_time)}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Let op:</strong> Ook alle gerelateerde
                afwezigheidsregistraties worden verwijderd.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuleren</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(roster)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Verwijderen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRosterDialog;


