import classAPI from '@/apis/classAPI';
import RequestHandler from '@/apis/RequestHandler';
import PageHeader from '@/components/shared/PageHeader';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { BookOpen, UserRound, Users, User } from 'lucide-react';
import { useEffect, useState } from 'react';

const StudentClassPage = () => {
    const [student, setStudent] = useState(null);
    const [klass, setKlass] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);
                setError('');

                const resp = await RequestHandler.get('/auth/me/student');
                const s = resp?.data;

                if (cancelled) return;

                setStudent(s || null);

                if (s?.class_id) {
                    const cl = await classAPI.get_class(s.class_id);
                    if (!cancelled) {
                        setKlass(cl);
                    }
                } else {
                    setKlass(null);
                }
            } catch (e) {
                console.error('Failed to load student class', e);
                if (!cancelled) {
                    setError('Je klas kon niet worden geladen.');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
        };
    }, []);

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex h-full items-center justify-center">
                    <div className="text-muted-foreground">Klasgegevens laden...</div>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex h-full items-center justify-center">
                    <p className="text-center text-sm text-red-600">{error}</p>
                </div>
            );
        }

        if (!student) {
            return (
                <div className="flex h-full items-center justify-center">
                    <p className="max-w-md text-center text-sm text-muted-foreground">
                        We kunnen je leerlingprofiel momenteel niet laden. Probeer opnieuw
                        in te loggen of neem contact op met de administratie.
                    </p>
                </div>
            );
        }

        if (!klass) {
            return (
                <div className="flex h-full items-center justify-center">
                    <p className="max-w-md text-center text-sm text-muted-foreground">
                        Je bent nog niet gekoppeld aan een klas. Neem contact op met de
                        administratie om je klas te laten koppelen.
                    </p>
                </div>
            );
        }

        const classmates = Array.isArray(klass.students) ? klass.students : [];

        return (
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-regular">{klass.name}</CardTitle>

                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-regular flex items-center gap-2">
                                <UserRound className="size-5" /> Mentor
                            </h3>
                            {klass.mentor ? (
                                <div className="space-y-1 text-sm">
                                    <p className="font-medium text-base">
                                        {klass.mentor.first_name} {klass.mentor.last_name}
                                    </p>
                                    <p className="text-regular">
                                        E-mail:{' '}
                                        <span className="font-normal">
                                            {klass.mentor.email || 'Onbekend'}
                                        </span>
                                    </p>
                                    <p className="text-regular">
                                        Telefoon:{' '}
                                        <span className="font-normal">
                                            {klass.mentor.phone || 'Onbekend'}
                                        </span>
                                    </p>
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-regular">
                                    Nog geen mentor toegewezen.
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-regular flex items-center gap-2">
                                <BookOpen className="size-5" />
                                Lespakket & schooljaar
                            </h3>
                            <p className="text-sm">
                                <span className="font-medium">
                                    {klass.course?.name || 'Onbekende opleiding'}
                                </span>
                            </p>
                            <p className="text-sm text-regular">
                                Schooljaar:{' '}
                                <span className="font-medium">
                                    {klass.school_year?.name || 'Onbekend'}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-regular">
                            Klasgenoten
                        </h3>
                        {classmates.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                Er zijn nog geen leerlingen aan deze klas gekoppeld.
                            </p>
                        ) : (
                            <div className="max-h-80 overflow-y-auto rounded-md  bg-white/60">
                                {classmates.map((s) => {
                                    const isMe = s.id === student.id;
                                    return (
                                        <div
                                            key={s.id}
                                            className="flex items-center justify-between px-3 py-2 text-sm border-b last:border-b-0"
                                        >
                                            <span>
                                                {s.first_name} {s.last_name}
                                            </span>
                                            {isMe && (
                                                <Badge variant="outline" className="">
                                                    <User className="size-5" /> 
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="flex h-full flex-col">
            <PageHeader
                title="Mijn klas"
                icon={<Users className="size-9" />}
                description="Bekijk je klasindeling en klasgenoten."
            />
            <div className="mt-4 flex-1 rounded-lg">
                {renderContent()}
            </div>
        </div>
    );
};

export default StudentClassPage;


