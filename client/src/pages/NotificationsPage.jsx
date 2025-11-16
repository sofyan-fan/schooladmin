import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { addNotification, loadNotifications } from '@/utils/notificationsStorage';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        setNotifications(loadNotifications());
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) {
            return;
        }

        const newNotification = {
            id: Date.now(),
            subject: subject.trim() || 'Melding',
            message: message.trim(),
            createdAt: new Date().toISOString(),
        };

        const updated = addNotification(newNotification);
        setNotifications(updated);
        setSubject('');
        setMessage('');
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

    return (
        <div className="container mx-auto">
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
                            Meldingen worden alleen in deze browser opgeslagen.
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
                                        className="border rounded-lg p-4 bg-white/60 flex flex-col gap-1"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-semibold text-regular">
                                                {n.subject || 'Melding'}
                                            </h3>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDateTime(n.createdAt)}
                                            </span>
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
        </div>
    );
};

export default NotificationsPage;


