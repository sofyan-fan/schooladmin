import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { addNotification, deleteNotification, loadNotifications, updateNotification } from '@/utils/notificationsStorage';
import { Bell, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isGlobal, setIsGlobal] = useState(false);
    const { user } = useAuth();
    
    // Edit modal state
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState(null);
    const [editSubject, setEditSubject] = useState('');
    const [editMessage, setEditMessage] = useState('');
    const [editIsGlobal, setEditIsGlobal] = useState(false);
    
    const isAdmin = useMemo(
        () => (user?.role || '').toLowerCase() === 'admin',
        [user?.role]
    );

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await loadNotifications();
                setNotifications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error loading notifications:', error);
                setNotifications([]);
            }
        };

        fetchNotifications();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedMessage = message.trim();
        const trimmedSubject = subject.trim();

        if (!trimmedMessage) {
            return;
        }

        try {
            const created = await addNotification({
                subject: trimmedSubject || 'Melding',
                message: trimmedMessage,
                is_global: isAdmin && isGlobal,
            });

            setNotifications((prev) =>
                created ? [created, ...(Array.isArray(prev) ? prev : [])] : prev
            );
            setSubject('');
            setMessage('');
            setIsGlobal(false);
        } catch (error) {
            console.error('Error creating notification:', error);
        }
    };

    const formatDateTime = (isoString) => {
        try {
            const date = new Date(isoString);
            return date.toLocaleString('nl-NL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return '';
        }
    };

    const handleEdit = (notification) => {
        setEditingNotification(notification);
        setEditSubject(notification.subject || '');
        setEditMessage(notification.message || '');
        setEditIsGlobal(notification.is_global || false);
        setEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingNotification || !editMessage.trim()) return;

        try {
            const updated = await updateNotification(editingNotification.id, {
                subject: editSubject.trim() || 'Melding',
                message: editMessage.trim(),
                is_global: editIsGlobal,
            });

            setNotifications((prev) =>
                prev.map((n) => (n.id === updated.id ? updated : n))
            );
            setEditModalOpen(false);
            setEditingNotification(null);
        } catch (error) {
            console.error('Error updating notification:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Weet je zeker dat je deze melding wilt verwijderen?')) {
            return;
        }

        try {
            await deleteNotification(id);
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    return (
        <div className="mx-auto">
            <PageHeader
                title="Meldingen"
                icon={<Bell className="size-9" />}
                description="Laat hier eenvoudig een melding achter: klacht, vraag of bericht."
            />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <Card>
                    <CardHeader>
                        <CardTitle>Nieuwe melding</CardTitle>
                        <CardDescription>
                            Vul de onderstaande velden in om een nieuwe melding toe te voegen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Onderwerp</Label>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="message">Bericht</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={5}
                                />
                            </div>
                            {isAdmin && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_global"
                                        checked={isGlobal}
                                        onCheckedChange={(checked) => setIsGlobal(checked === true)}
                                    />
                                    <Label htmlFor="is_global" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                                        {/* <Globe className="size-4" /> */}
                                        Zichtbaar voor alle gebruikers
                                    </Label>
                                </div>
                            )}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={!message.trim()}>
                                    Melding plaatsen
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Alle meldingen</CardTitle>
                        <CardDescription>
                            Bekijk hier alle meldingen.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {notifications.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                                Er zijn nog geen meldingen. Vul links het formulier in om de eerste melding te plaatsen.
                            </p>
                        ) : (
                            <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`border rounded-lg p-4 flex flex-col gap-1 ${n.is_global ? 'bg-blue-50 border-blue-200' : 'bg-white/60'}`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-regular">
                                                    {n.subject || 'Melding'}
                                                </h3>
                                                {n.is_global && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                                        {/* <Globe className="size-3" /> */}
                                                        Globaal
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDateTime(n.createdAt || n.created_at)}
                                                </span>
                                                {isAdmin && (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleEdit(n)}
                                                            title="Bewerken"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(n.id)}
                                                            title="Verwijderen"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-sm text-regular whitespace-pre-wrap">
                                            {n.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Edit Modal */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Melding bewerken</DialogTitle>
                        <DialogDescription>
                            Pas de melding aan en sla de wijzigingen op.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-subject">Onderwerp</Label>
                            <Input
                                id="edit-subject"
                                value={editSubject}
                                onChange={(e) => setEditSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-message">Bericht</Label>
                            <Textarea
                                id="edit-message"
                                value={editMessage}
                                onChange={(e) => setEditMessage(e.target.value)}
                                rows={5}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="edit-is_global"
                                checked={editIsGlobal}
                                onCheckedChange={(checked) => setEditIsGlobal(checked === true)}
                            />
                            <Label htmlFor="edit-is_global" className="text-sm font-normal cursor-pointer flex items-center gap-1.5">
                                {/* <Globe className="size-4" /> */}
                                Zichtbaar voor alle gebruikers
                            </Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                Annuleren
                            </Button>
                            <Button type="submit" disabled={!editMessage.trim()}>
                                Opslaan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NotificationsPage;


