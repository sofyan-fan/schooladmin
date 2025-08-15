import { BookOpenCheck, HeartPulse, Scale } from 'lucide-react';

const courses = [
  {
    id: 'Arabisch – Beginner',
    title: 'Arabisch voor Beginners',
    description:
      'Leer de basis van de Arabische taal, van het alfabet tot eenvoudige zinnen.',
    details: 'Dit pakket is perfect voor absolute beginners...',
    icon: BookOpenCheck,
    price: '€150 / kwartaal',
  },
  {
    id: 'Tajwīd',
    title: 'Tajwīd',
    description: 'Perfectioneer je koranrecitatie...',
    details: 'Onze Tajwīd-lessen richten zich op...',
    icon: HeartPulse,
    price: '€120 / kwartaal',
  },
  {
    id: 'Fiqh (basics)',
    title: 'Fiqh (Basis)',
    description: 'Begrijp de fundamenten...',
    details: 'Deze cursus behandelt de basisprincipes...',
    icon: Scale,
    price: '€100 / kwartaal',
  },
  {
    id: 'Sīrah',
    title: 'Sīrah van de Profeet ﷺ',
    description: 'Ontdek het leven van de Profeet...',
    details: 'Deze cursus neemt je mee...',
    icon: Scale,
    price: '€110 / kwartaal',
  },
];

export default courses;
