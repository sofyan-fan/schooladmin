import { z } from 'zod';
import { minStudentBirthDate } from './helpers';

export const schemaAccount = z.object({
  email: z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(8, 'Minimaal 8 tekens'),
});

export const schemaPersonalStudent = z.object({
  firstName: z.string().min(1, 'Verplicht'),
  lastName: z.string().min(1, 'Verplicht'),
  birthDate: z.coerce
    .date({ required_error: 'Geboortedatum is verplicht' })
    .refine(
      (d) => d <= minStudentBirthDate(),
      'Je moet minimaal 4 jaar oud zijn'
    ),
  gender: z.enum(['Man', 'Vrouw']).optional(),
});

export const schemaPersonalTeacher = z.object({
  firstName: z.string().min(1, 'Verplicht'),
  lastName: z.string().min(1, 'Verplicht'),
  birthDate: z.coerce.date({ required_error: 'Geboortedatum is verplicht' }),
  gender: z.enum(['Man', 'Vrouw']).optional(),
  address: z.string().min(1, 'Verplicht'),
  city: z.string().min(1, 'Verplicht'),
  postalCode: z.string().min(1, 'Verplicht'),
  phone: z.string().min(6, 'Te kort'),
});

export const schemaParentContact = z.object({
  parentName: z.string().min(1, 'Naam van ouder/verzorger is verplicht.'),
  address: z.string().min(1, 'Verplicht'),
  city: z.string().min(1, 'Verplicht'),
  postalCode: z.string().min(1, 'Verplicht'),
  phone: z.string().min(6, 'Te kort'),
});

export const schemaEnrollStudent = z.object({
  lesson_package: z.string().min(1, 'Kies een lespakket'),
  payment_method: z.enum(['SEPA incasso', 'iDEAL', 'Contant']).optional(),
});
