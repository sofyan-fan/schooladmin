import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { BookOpen, Calendar, LibraryBig, StickyNote, Users } from 'lucide-react';

function formatDateNL(raw) {
    if (!raw) return null;
    try {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return d.toLocaleDateString('nl-NL');
    } catch {
        // ignore
    }
    return String(raw);
}

const Row = ({ icon, label, value, clamp }) => {
    if (!value) return null;
    return (
        <li className="flex items-start gap-3">
            <span className="text-muted-foreground mt-0.5">{icon}</span>
            <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p
                    className={
                        clamp
                            ? 'text-lg font-medium break-words line-clamp-3'
                            : 'text-lg font-medium truncate'
                    }
                >
                    {value}
                </p>
            </div>
        </li>
    );
};

export default function ViewModal({ open, onOpenChange, book, onEdit }) {
    if (!book) return null;

    const title = book.title || 'Boek';
    const moduleName = book.moduleName || null;
    const ownedCount = book.ownedCount ?? 0;
    const inStoreCount = book.inStoreCount ?? 0;
    const totalCount = book.totalCount ?? 0;
    const notes = book.notes || null;
    const addedAt = formatDateNL(book.addedAt);
    const updatedAt = formatDateNL(book.updatedAt);
    const allocations = Array.isArray(book.allocationsDetailed)
        ? book.allocationsDetailed
        : Array.isArray(book.allocations)
            ? book.allocations
            : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(94vw,520px)] sm:!max-w-[920px] p-0 overflow-hidden bg-white rounded-2xl">
                <DialogHeader className="p-7 pb-0">
                    <div className="flex items-start justify-between gap-5">
                        <div className="flex items-center gap-5 min-w-0">
                            <div
                                className={[
                                    'size-18 shrink-0 rounded-full grid place-items-center bg-muted',
                                    inStoreCount > 0 ? 'ring-2 ring-emerald-200' : 'ring-2 ring-muted-foreground/20',
                                ].join(' ')}
                                aria-label="Boek"
                            >
                                <BookOpen className="size-8 text-muted-foreground" />
                            </div>

                            <div className="min-w-0">
                                <DialogTitle className="text-3xl font-semibold leading-tight truncate">
                                    {title}
                                </DialogTitle>

                                <div className="mt-3 flex flex-wrap items-center gap-2.5">
                                    <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                                        Boekenvoorraad
                                    </Badge>
                                    {moduleName ? (
                                        <Badge variant="outline" className="text-sm px-2.5 py-0.5">
                                            {moduleName}
                                        </Badge>
                                    ) : null}
                                    <Badge
                                        variant="secondary"
                                        className="text-sm px-2.5 py-0.5 bg-amber-50 text-amber-800"
                                    >
                                        In bezit: {ownedCount}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="text-sm px-2.5 py-0.5 bg-emerald-50 text-emerald-700"
                                    >
                                        In store: {inStoreCount}
                                    </Badge>
                                    <Badge variant="secondary" className="text-sm px-2.5 py-0.5">
                                        Totaal: {totalCount}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {onEdit ? (
                            <Button size="sm" variant="outline" onClick={onEdit}>
                                Bewerken
                            </Button>
                        ) : null}
                    </div>
                </DialogHeader>

                <div className="p-7 pt-6 max-h-[75vh] overflow-y-auto [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-track]:border-0 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15 hover:[&::-webkit-scrollbar-thumb]:bg-foreground/25">
                    <section>
                        <h3 className="text-base font-medium text-muted-foreground mb-3.5">
                            Details
                        </h3>
                        <ul className="space-y-3">
                            <Row
                                icon={<LibraryBig size={20} />}
                                label="Course module"
                                value={moduleName}
                            />
                            <Row
                                icon={<Users size={20} />}
                                label="In bezit"
                                value={String(ownedCount)}
                            />
                            <Row icon={<BookOpen size={20} />} label="In store" value={String(inStoreCount)} />
                            <Row icon={<BookOpen size={20} />} label="Totaal" value={String(totalCount)} />
                            <Row
                                icon={<StickyNote size={20} />}
                                label="Notities"
                                value={notes}
                                clamp
                            />
                        </ul>
                    </section>

                    <section className="mt-8">
                        <h3 className="text-base font-medium text-muted-foreground mb-3.5">
                            Uitgifte
                        </h3>
                        {allocations.length ? (
                            <div className="rounded-lg border overflow-hidden">
                                <div className="divide-y">
                                    {allocations.map((a, idx) => (
                                        <div
                                            key={`${a.studentId ?? 'student'}-${idx}`}
                                            className="flex items-center justify-between gap-4 px-4 py-3"
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm font-medium truncate">
                                                    {a.studentName || `Student ${a.studentId}`}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    ID: {a.studentId}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="tabular-nums">
                                                {a.qty}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
                                Geen uitgiftes geregistreerd.
                            </div>
                        )}
                    </section>

                    {(addedAt || updatedAt) && (
                        <section className="mt-8">
                            <h3 className="text-base font-medium text-muted-foreground mb-3.5">
                                Administratie
                            </h3>
                            <ul className="space-y-3">
                                <Row
                                    icon={<Calendar size={20} />}
                                    label="Toegevoegd"
                                    value={addedAt}
                                />
                                <Row
                                    icon={<Calendar size={20} />}
                                    label="Laatst bijgewerkt"
                                    value={updatedAt}
                                />
                            </ul>
                        </section>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}


