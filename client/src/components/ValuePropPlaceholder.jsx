// src/components/ValuePropPlaceholder.jsx
import { cn } from '@/lib/utils';
import Autoplay from 'embla-carousel-autoplay';
import useEmblaCarousel from 'embla-carousel-react';
import {
  BarChart,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

const valueProps = [
  {
    icon: <GraduationCap className="w-12 h-12 text-primary" />,
    title: 'Gepersonaliseerd Leren',
    description: 'Lesprogramma’s op maat voor elke leerling.',
  },
  {
    icon: <BookOpen className="w-12 h-12 text-primary" />,
    title: 'Uitgebreid Lesmateriaal',
    description: 'Toegang tot een brede selectie van vakken en cursussen.',
  },
  {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: 'Ervaren Docenten',
    description: 'Gekwalificeerde en gepassioneerde begeleiding.',
  },
  {
    icon: <BarChart className="w-12 h-12 text-primary" />,
    title: 'Voortgangsrapportages',
    description: 'Gedetailleerd inzicht in de ontwikkeling van de leerling.',
  },
  {
    icon: <ShieldCheck className="w-12 h-12 text-primary" />,
    title: 'Veilige Leeromgeving',
    description: 'Een betrouwbare en ondersteunende online omgeving.',
  },
];

export function ValuePropPlaceholder() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-8 bg-transparent dark:bg-gray-900/50 overflow-hidden">
      <div className="overflow-hidden w-full" ref={emblaRef}>
        <div className="flex">
          {valueProps.map((prop, index) => (
            <div
              key={index}
              className="flex-[0_0_100%] min-w-0 flex flex-col items-center justify-center text-center p-4 space-y-4"
            >
              <div className="flex items-center justify-center size-24 rounded-full bg-primary/10">
                {prop.icon}
              </div>
              <h3 className="text-3xl font-medium text-gray-800 dark:text-gray-100">
                {prop.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-6">
        {valueProps.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              'w-2 h-2 rounded-full',
              selectedIndex === index
                ? 'bg-primary'
                : 'bg-gray-300 dark:bg-gray-600'
            )}
            aria-label={`Ga naar slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
