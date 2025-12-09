
import { BarChart3, BookOpen, Clock3, LayoutDashboard, ShieldCheck } from 'lucide-react';

const LandingPage = () => {
    const benefits = [
        {
            title: 'Alles op één plek',
            description:
                'Beheer leerlingen, klassen, lespakketten, toetsen en financiën in één overzichtelijk dashboard.',
        },
        {
            title: 'Tijd besparen',
            description:
                'Geen stapels papierwerk meer of handmatige administratie – alles gaat digitaal en efficiënt.',
        },
        {
            title: 'Volledig overzicht',
            description:
                'Altijd inzicht in leerlinggegevens, toetsresultaten, urenregistratie en financiële transacties.',
        },
        {
            title: 'Veilig en betrouwbaar',
            description:
                'Geen verloren documenten meer; alle data is veilig opgeslagen en makkelijk terug te vinden.',
        },
        {
            title: 'Eenvoudig lesmateriaal beheren',
            description:
                "Maak en beheer zelfstandig lespakketten, vakken en Qur'an-tracking, afgestemd op jouw onderwijsinstelling.",
        },
    ].map((benefit, index) => {
        const icons = [LayoutDashboard, Clock3, BarChart3, ShieldCheck, BookOpen];
        return { ...benefit, icon: icons[index] ?? LayoutDashboard };
    });

    return (
        <main className="min-h-screen bg-gray-100 px-3 py-6 dark:bg-gray-950 sm:px-6 sm:py-10 ">
            <div className="mx-auto max-w-7xl ">
                <section className="space-y-10 bg-card px-4 py-6 rounded-2xl shadow-sm sm:px-8 sm:py-8 lg:px-10 lg:py-0">
                    {/* Hero section */}
                    <section
                        aria-labelledby="hero-heading"
                        className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center"
                    >
                        <div className="space-y-6">

                            <h1
                                id="hero-heading"
                                className="text-4xl font-semibold tracking-tight text-regular sm:text-5xl lg:text-3xl"
                            >
                                MaktApp, dé digitale tool voor moskeeën en Islamitische
                                onderwijsinstellingen
                            </h1>
                            <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
                                Met Maktapp organiseer je het volledige onderwijsproces: van
                                leerlingenbeheer en klassenindeling tot toetsbeheer, Qur'an-tracking
                                en financiële administratie. Alles op één plek, eenvoudig en
                                tijdbesparend.
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <button className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card">
                                    Vraag een demo aan
                                </button>
                                <button className="inline-flex items-center justify-center rounded-full border border-border bg-transparent px-6 py-2.5 text-sm font-semibold text-regular hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card">
                                    CTA label
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center lg:justify-end">
                            <div className="flex h-64 w-full max-w-md items-center justify-center rounded-2xl border border-dashed border-border bg-muted text-xs text-muted-foreground sm:h-80">
                                <img
                                    src="https://placehold.co/600x400"
                                    alt="Product screenshot placeholder"
                                    className="h-full w-full rounded-xl object-cover"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Partners section */}
                    <section aria-label="Partners" className="space-y-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Vertrouwd door organisaties (placeholder)
                        </p>
                        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border bg-muted text-[10px] text-muted-foreground"
                                >
                                    Logo
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Benefits section */}
                    <section
                        aria-labelledby="benefits-heading"
                        className="space-y-6 border-t border-border pt-8"
                    >
                        <div className="space-y-2">
                            <h2
                                id="benefits-heading"
                                className="text-2xl font-semibold tracking-tight text-regular sm:text-3xl"
                            >
                                Voordelen
                            </h2>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                Korte zin die de belangrijkste voordelen van MaktApp samenvat.
                            </p>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {benefits.map((benefit) => {
                                const Icon = benefit.icon;
                                return (
                                    <article
                                        key={benefit.title}
                                        className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-5"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-semibold text-regular">
                                                    {benefit.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {benefit.description}
                                                </p>
                                            </div>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>

                    {/* How it works section */}
                    <section
                        aria-labelledby="how-it-works-heading"
                        className="space-y-6 border-t border-border pt-8"
                    >
                        <div className="space-y-2">
                            <h2
                                id="how-it-works-heading"
                                className="text-2xl font-semibold tracking-tight text-regular sm:text-3xl"
                            >
                                Hoe het werkt
                            </h2>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                Eén zin die uitlegt hoe je stap voor stap met het platform werkt.
                            </p>
                        </div>
                        <ol className="grid gap-6 md:grid-cols-3">
                            {['Stap één', 'Stap twee', 'Stap drie'].map((titel, index) => (
                                <li
                                    key={titel}
                                    className="flex flex-col gap-3 rounded-xl border border-border bg-muted p-5"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                        {index + 1}
                                    </div>
                                    <h3 className="text-sm font-semibold text-regular">{titel}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Korte beschrijving bij {titel.toLowerCase()}.
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    {/* Pricing section */}
                    <section
                        aria-labelledby="pricing-heading"
                        className="space-y-6 border-t border-border pt-8"
                    >
                        <div className="space-y-2 text-center">
                            <h2
                                id="pricing-heading"
                                className="text-2xl font-semibold tracking-tight text-regular sm:text-3xl"
                            >
                                Prijzen
                            </h2>
                            <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                                Korte tekst die de verschillende pakketten toelicht.
                            </p>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {[
                                { name: 'Starter', highlighted: false },
                                { name: 'Pro', highlighted: true },
                                { name: 'Advanced', highlighted: false },
                            ].map((tier) => (
                                <article
                                    key={tier.name}
                                    className={`flex flex-col justify-between rounded-2xl border bg-muted p-6 ${tier.highlighted
                                        ? 'border-primary shadow-lg shadow-primary/15'
                                        : 'border-border'
                                        }`}
                                    aria-label={`${tier.name} pakket`}
                                >
                                    <div className="space-y-4">
                                        <header className="space-y-1">
                                            <h3 className="text-sm font-semibold text-regular">
                                                {tier.name}
                                            </h3>
                                            <p className="flex items-baseline gap-1 text-3xl font-semibold text-regular">
                                                <span>Prijs</span>
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    /maand
                                                </span>
                                            </p>
                                        </header>
                                        <ul className="space-y-2 text-sm text-muted-foreground">
                                            <li>Functie bullet placeholder 1</li>
                                            <li>Functie bullet placeholder 2</li>
                                            <li>Functie bullet placeholder 3 (optioneel)</li>
                                        </ul>
                                    </div>
                                    <button
                                        className={`mt-6 w-full rounded-full px-4 py-2.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card ${tier.highlighted
                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary'
                                            : 'border border-border bg-transparent text-regular hover:bg-muted focus-visible:ring-ring'
                                            }`}
                                    >
                                        {tier.name} CTA
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>

                    {/* Testimonials section */}
                    <section
                        aria-labelledby="testimonials-heading"
                        className="space-y-6 border-t border-border pt-8"
                    >
                        <div className="space-y-2">
                            <h2
                                id="testimonials-heading"
                                className="text-2xl font-semibold tracking-tight text-regular sm:text-3xl"
                            >
                                Ervaringen
                            </h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <figure
                                    key={index}
                                    className="flex flex-col gap-4 rounded-xl border border-border bg-muted p-5"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-xs text-muted-foreground">
                                                Avatar
                                            </div>
                                            <figcaption className="text-sm font-medium text-regular">
                                                Naam klant
                                            </figcaption>
                                        </div>
                                        <div
                                            className="flex text-xs text-yellow-400"
                                            aria-label="Sterrenrating placeholder"
                                        >
                                            ★★★★★
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Korte ervaringstekst {index + 1}.
                                    </p>
                                </figure>
                            ))}
                        </div>
                    </section>

                    {/* FAQ section */}
                    <section
                        aria-labelledby="faq-heading"
                        className="space-y-5 border-t border-border pt-8"
                    >
                        <div className="space-y-2">
                            <h2
                                id="faq-heading"
                                className="text-2xl font-semibold tracking-tight text-regular sm:text-3xl"
                            >
                                Veelgestelde vragen
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <details
                                    key={index}
                                    className="group rounded-lg border border-border bg-muted p-4"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-medium text-regular">
                                        <span>Vraag placeholder {index + 1}?</span>
                                        <span className="text-xs text-muted-foreground group-open:hidden">
                                            +
                                        </span>
                                        <span className="hidden text-xs text-muted-foreground group-open:inline">
                                            -
                                        </span>
                                    </summary>
                                    <p className="mt-3 text-sm text-muted-foreground">
                                        Antwoordtekst placeholder voor vraag {index + 1}.
                                    </p>
                                </details>
                            ))}
                        </div>
                    </section>

                    {/* Final CTA section */}
                    <section aria-label="Laatste call to action">
                        <div className="border border-primary bg-primary/5 px-6 py-6 sm:px-8 sm:py-8">
                            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-semibold tracking-tight text-regular sm:text-3xl">
                                        Laatste CTA titel
                                    </h2>
                                    <p className="max-w-xl text-sm text-muted-foreground">
                                        Korte laatste aanmoediging om vrijblijvend met MaktApp aan de slag te gaan.
                                    </p>
                                </div>
                                <button className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card">
                                    Laatste CTA knop label
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="mt-4 border-t border-border pt-8 text-sm text-muted-foreground">
                        <div className="grid gap-8 md:grid-cols-4">
                            <div className="space-y-3">
                                <div className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-regular">
                                    Logo
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Korte product tagline placeholder.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Menu
                                </h3>
                                <ul className="mt-3 space-y-2 text-xs">
                                    <li>Menu link 1</li>
                                    <li>Menu link 2</li>
                                    <li>Menu link 3</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Juridisch
                                </h3>
                                <ul className="mt-3 space-y-2 text-xs">
                                    <li>Juridische link 1</li>
                                    <li>Juridische link 2</li>
                                    <li>Juridische link 3</li>
                                </ul>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                    Nieuwsbrief
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Korte omschrijving nieuwsbrief placeholder.
                                </p>
                                <form className="flex flex-col gap-2 sm:flex-row">
                                    <label className="sr-only" htmlFor="newsletter-email">
                                        Nieuwsbrief e-mailadres
                                    </label>
                                    <input
                                        id="newsletter-email"
                                        type="email"
                                        className="h-9 flex-1 rounded-md border border-border bg-muted px-3 text-xs text-regular placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="E-mailadres placeholder"
                                    />
                                    <button
                                        type="submit"
                                        className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                                    >
                                        Inschrijven
                                    </button>
                                </form>
                            </div>
                        </div>
                        <p className="mt-8 text-xs text-muted-foreground">
                            © Copyright tekst placeholder.
                        </p>
                    </footer>
                </section>
            </div>
        </main>
    );
};

export default LandingPage;

