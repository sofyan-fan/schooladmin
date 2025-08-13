import { zodResolver } from '@hookform/resolvers/zod';
import {
  BookOpenCheck,
  CreditCard,
  Eye,
  EyeOff,
  HandCoins,
  HeartPulse,
  Landmark,
  Scale,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
// shadcn/ui
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // New
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import StudentIconSelected from '@/assets/user_icons/role_icons/student/selected.svg?react';
import StudentIcon from '@/assets/user_icons/role_icons/student/unselected.svg?react';
import TeacherIconSelected from '@/assets/user_icons/role_icons/teacher/selected.svg?react';
import TeacherIcon from '@/assets/user_icons/role_icons/teacher/unselected.svg?react';
import { DatePicker } from '@/components/ui/date-picker';

// ---------------- schemas ----------------
const schemaAccount = z.object({
  role: z.enum(['student', 'teacher'], {
    required_error: 'Kies een rol.',
  }),
  email: z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(8, 'Minimaal 8 tekens'),
});

const schemaPersonalStudent = z.object({
  // Student details
  firstName: z.string().min(1, 'Verplicht'),
  lastName: z.string().min(1, 'Verplicht'),
  birthDate: z
    .date({ required_error: 'Geboortedatum is verplicht' })
    .refine((d) => {
      const today = new Date();
      const minAgeYears = 4;
      const cutoff = new Date(
        today.getFullYear() - minAgeYears,
        today.getMonth(),
        today.getDate()
      );
      return d <= cutoff;
    }, 'Je moet minimaal 4 jaar oud zijn'),
  gender: z.enum(['Man', 'Vrouw']).optional(),
});

const schemaPersonalTeacher = z.object({
  // Teacher details
  firstName: z.string().min(1, 'Verplicht'),
  lastName: z.string().min(1, 'Verplicht'),
  birthDate: z.date({ required_error: 'Geboortedatum is verplicht' }),
  gender: z.enum(['Man', 'Vrouw']).optional(),
  address: z.string().min(1, 'Verplicht'),
  city: z.string().min(1, 'Verplicht'),
  postalCode: z.string().min(1, 'Verplicht'),
  phone: z.string().min(6, 'Te kort'),
});

const schemaParentContact = z.object({
  // Parent & contact details
  parentName: z.string().min(1, 'Naam van ouder/verzorger is verplicht.'),
  address: z.string().min(1, 'Verplicht'),
  city: z.string().min(1, 'Verplicht'),
  postalCode: z.string().min(1, 'Verplicht'),
  phone: z.string().min(6, 'Te kort'),
});

const schemaEnrollStudent = z.object({
  lesson_package: z.string().min(1, 'Kies een lespakket'),
  payment_method: z.enum(['SEPA incasso', 'iDEAL', 'Contant']).optional(),
});

const defaultValues = {
  // step 1
  role: 'student',
  email: '',
  password: '',
  // step 2
  firstName: '',
  lastName: '',
  birthDate: undefined,
  gender: undefined,
  address: '',
  city: '',
  postalCode: '',
  phone: '',
  parentName: '',
  // step 3
  lesson_package: '',
  payment_method: 'iDEAL',
};

// ---------------- helpers ----------------
function strength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return {
    score,
    label:
      ['Zwak', 'Matig', 'Gemiddeld', 'Sterk', 'Zeer sterk'][score] || 'Zwak',
  };
}

// Using the same course list as the original RegisterPage
// Place this near your other constants, outside the main component
const courses = [
  {
    id: 'Arabisch – Beginner',
    title: 'Arabisch voor Beginners',
    description:
      'Leer de basis van de Arabische taal, van het alfabet tot eenvoudige zinnen.',
    details:
      'Dit pakket is perfect voor absolute beginners. We behandelen het volledige Arabische alfabet, basisgrammatica, en alledaagse conversatie. Na afronding kun je jezelf voorstellen en eenvoudige gesprekken voeren.',
    icon: BookOpenCheck,
    price: '€150 / kwartaal',
  },
  {
    id: 'Tajwīd',
    title: 'Tajwīd',
    description:
      'Perfectioneer je koranrecitatie met de juiste uitspraak en regels.',
    details:
      'Onze Tajwīd-lessen richten zich op de aḥkām (regels) van het reciteren van de Koran. Dit is bedoeld voor studenten die al kunnen lezen maar hun recitatie willen verfijnen volgens de traditionele regels.',
    icon: HeartPulse,
    price: '€120 / kwartaal',
  },
  {
    id: 'Fiqh (basics)',
    title: 'Fiqh (Basis)',
    description: 'Begrijp de fundamenten van de islamitische jurisprudentie.',
    details:
      'Deze cursus behandelt de basisprincipes van Fiqh, inclusief de voorwaarden van het gebed, vasten, en andere pilaren van de Islam. Het is een essentiële cursus voor elke moslim die zijn/haar aanbidding wil valideren.',
    icon: Scale,
    price: '€100 / kwartaal',
  },
];

// ---------------- main ----------------
export default function RegisterWizard() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState('');

  const [currentRole, setCurrentRole] = useState('student');
  const isStudentFlow = currentRole === 'student';
  const totalSteps = isStudentFlow ? 4 : 2;

  const schemas = useMemo(() => {
    return isStudentFlow
      ? [
          schemaAccount,
          schemaPersonalStudent,
          schemaParentContact,
          schemaEnrollStudent,
        ]
      : [schemaAccount, schemaPersonalTeacher];
  }, [isStudentFlow]);

  const methods = useForm({
    resolver: zodResolver(schemas[step]),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const { handleSubmit, trigger, watch, control } = methods;

  const watchedRole = watch('role');

  useEffect(() => {
    if (watchedRole && watchedRole !== currentRole) {
      setCurrentRole(watchedRole);
    }
  }, [watchedRole, currentRole]);

  const currentFields = useMemo(() => {
    if (step === 0) return ['role', 'email', 'password'];
    if (step === 1) {
      return isStudentFlow
        ? ['firstName', 'lastName', 'birthDate', 'gender']
        : [
            'firstName',
            'lastName',
            'birthDate',
            'gender',
            'address',
            'city',
            'postalCode',
            'phone',
          ];
    }
    if (step === 2 && isStudentFlow) {
      return ['parentName', 'address', 'city', 'postalCode', 'phone'];
    }
    if (step === 3 && isStudentFlow) {
      return ['lesson_package', 'payment_method'];
    }
    return [];
  }, [step, isStudentFlow]);

  const next = async () => {
    const ok = await trigger(currentFields);
    if (ok) {
      if (step < totalSteps - 1) {
        setStep((s) => s + 1);
      }
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const { email, password, role, ...studentDetails } = values;

      const profileData = {
        first_name: studentDetails.firstName,
        last_name: studentDetails.lastName,
        birth_date: studentDetails.birthDate
          ? new Date(studentDetails.birthDate).toISOString()
          : null,
        gender: studentDetails.gender,
        address: studentDetails.address,
        postal_code: studentDetails.postalCode,
        city: studentDetails.city,
        phone: studentDetails.phone,
        parent_name: studentDetails.parentName,
        parent_email: email,
        lesson_package: studentDetails.lesson_package,
        payment_method: studentDetails.payment_method || null,
      };

      const success = await register(email, password, role, profileData);

      if (success) {
        navigate('/dashboard');
      } else {
        setFormError('Registratie is mislukt. Bestaat het e-mailadres al?');
      }
    } catch (err) {
      setFormError(err?.message || 'Er ging iets mis bij het registreren.');
    }
  };

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 pt-10">
      <div className="mx-auto w-full max-w-5xl rounded-2xl border bg-background shadow-sm overflow-hidden grid md:grid-cols-[280px_1fr]">
        {/* Left Column: Stepper */}
        <div className="bg-muted/30 p-8 border-r">
          <Stepper step={step} role={watchedRole || 'student'} />
        </div>

        {/* Right Column: Form Content */}
        <div className="p-8">
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Registreren</h1>
              <p className="text-muted-foreground mt-1">
                Maak een nieuw account aan
              </p>
            </div>

            <FormProvider {...methods}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {step === 0 && <StepAccount control={control} watch={watch} />}
                {step === 1 && <StepPersonal control={control} watch={watch} />}
                {step === 2 && isStudentFlow && (
                  <StepParentContact control={control} />
                )}
                {step === 3 && isStudentFlow && (
                  <StepEnroll control={control} />
                )}

                {formError && (
                  <p className="text-sm text-red-600">{formError}</p>
                )}

                <Separator />
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={back}
                    disabled={step === 0}
                  >
                    Terug
                  </Button>
                  {step < totalSteps - 1 ? (
                    <Button type="button" onClick={next}>
                      Doorgaan
                    </Button>
                  ) : (
                    <Button type="submit">Registreren</Button>
                  )}
                </div>
              </form>
            </FormProvider>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Heb je al een account?{' '}
              <Link className="underline" to="/login">
                Log hier in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- UI parts ----------------
function Stepper({ step, role }) {
  const studentSteps = [
    'Account',
    'Gegevens Leerling',
    'Gegevens Ouder',
    'Inschrijving',
  ];
  const teacherSteps = ['Account', 'Persoonlijke Gegevens'];
  const steps = role === 'student' ? studentSteps : teacherSteps;

  return (
    <div className="flex flex-col gap-8">
      {steps.map((label, i) => {
        const isActive = i === step;
        const isCompleted = i < step;
        return (
          <div key={label} className="flex items-start gap-4">
            <div
              className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-primary bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-muted text-muted-foreground'
              }`}
            >
              {i + 1}
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">{`Stap ${
                i + 1
              }`}</p>
              <p
                className={`font-semibold ${
                  !isActive && !isCompleted
                    ? 'text-muted-foreground'
                    : 'text-foreground'
                }`}
              >
                {label}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StepAccount({ control, watch }) {
  const pw = watch('password') || '';
  const s = strength(pw);

  const [show, setShow] = useState(false);

  return (
    <div className="space-y-6">
      <FormField
        control={control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ik registreer als</FormLabel>
            <FormControl>
              <RadioGroup
                className="flex gap-4"
                value={field.value}
                onValueChange={field.onChange}
              >
                {[
                  { id: 'student', label: 'Leerling' },
                  { id: 'teacher', label: 'Docent' },
                ].map((r) => (
                  <RoleIcon
                    key={r.id}
                    role={r.id}
                    label={r.label}
                    selected={field.value === r.id}
                    onClick={() => field.onChange(r.id)}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>E-mailadres</FormLabel>
            <FormControl>
              <Input placeholder="naam@voorbeeld.nl" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Wachtwoord</FormLabel>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                placeholder="Minimaal 8 tekens"
                {...field}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {show ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-2 h-1.5 w-full rounded bg-muted">
              <div
                className={`h-1.5 rounded transition-all ${
                  [
                    'bg-red-500',
                    'bg-orange-500',
                    'bg-yellow-500',
                    'bg-green-500',
                    'bg-green-600',
                  ][s.score]
                }`}
                style={{ width: `${(s.score / 4) * 100}%` }}
              />
            </div>
            <FormDescription>Sterkte: {s.label}</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function StepPersonal({ control, watch }) {
  const role = watch('role');
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">
        Gegevens {role === 'student' ? 'Leerling' : 'Docent'}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormText
          name="firstName"
          label="Voornaam"
          placeholder="Voornaam"
          control={control}
        />
        <FormText
          name="lastName"
          label="Achternaam"
          placeholder="Achternaam"
          control={control}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="birthDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Geboortedatum</FormLabel>
              <DatePicker
                id="birthDate"
                value={field.value}
                onChange={field.onChange}
                toYear={new Date().getFullYear() - 4}
                fromYear={1900}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Geslacht</FormLabel>
              <RadioGroup
                className="flex flex-wrap gap-2"
                value={field.value}
                onValueChange={field.onChange}
              >
                {[
                  { id: 'Man', label: 'Man' },
                  { id: 'Vrouw', label: 'Vrouw' },
                ].map((g) => (
                  <LabelPill
                    key={g.id}
                    selected={field.value === g.id}
                    onClick={() => field.onChange(g.id)}
                  >
                    {g.label}
                  </LabelPill>
                ))}
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {role === 'teacher' && (
        <>
          <h3 className="text-lg font-semibold border-b pb-2 mt-6">
            Contactgegevens
          </h3>
          <FormText
            name="address"
            label="Adres"
            placeholder="Straat en huisnummer"
            control={control}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormText
              name="city"
              label="Woonplaats"
              placeholder="Bijv. Rotterdam"
              control={control}
            />
            <FormText
              name="postalCode"
              label="Postcode"
              placeholder="1234 AB"
              control={control}
            />
          </div>
          <FormText
            name="phone"
            label="Telefoonnummer"
            placeholder="+31 6 12345678"
            control={control}
          />
        </>
      )}
    </div>
  );
}

function StepParentContact({ control }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">
        Gegevens Ouder/Verzorger & Contact
      </h3>
      <FormText
        name="parentName"
        label="Volledige Naam Ouder/Verzorger"
        placeholder="Naam"
        control={control}
      />
      <FormText
        name="address"
        label="Adres"
        placeholder="Straat en huisnummer"
        control={control}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormText
          name="city"
          label="Woonplaats"
          placeholder="Bijv. Rotterdam"
          control={control}
        />
        <FormText
          name="postalCode"
          label="Postcode"
          placeholder="1234 AB"
          control={control}
        />
      </div>
      <FormText
        name="phone"
        label="Telefoonnummer"
        placeholder="+31 6 12345678"
        control={control}
      />
    </div>
  );
}

// Place this near your other constants, outside the main component

// ===================================================================
// REVISED StepEnroll COMPONENT AND ITS HELPERS
// ===================================================================

// ===================================================================
// REVISED StepEnroll COMPONENT AND ITS HELPERS
// ===================================================================

function StepEnroll({ control }) {
  const paymentOptions = [
    {
      id: 'iDEAL',
      label: 'iDEAL',
      description: 'Veilig betalen via je eigen bank.',
      icon: CreditCard,
    },
    {
      id: 'SEPA incasso',
      label: 'SEPA incasso',
      description: 'Automatische maandelijkse afschrijving.',
      icon: Landmark,
    },
    {
      id: 'Contant',
      label: 'Contant',
      description: 'Betaal contant op locatie.',
      icon: HandCoins,
    },
  ];

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold border-b pb-2">
        Inschrijving & Betaling
      </h3>

      {/* --- Lespakket / Course Selection --- */}
      <FormField
        control={control}
        name="lesson_package"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel className="text-base font-semibold">
                Kies je lespakket
              </FormLabel>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="link" className="pr-0">
                    Bekijk details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px]">
                  <DialogHeader>
                    <DialogTitle>Details Lespakketten</DialogTitle>
                    <DialogDescription>
                      Hieronder vind je een gedetailleerd overzicht van alle
                      beschikbare lespakketten.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <course.icon className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold">
                            {course.title} -{' '}
                            <span className="text-muted-foreground">
                              {course.price}
                            </span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {course.details}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <FormControl>
              <RadioGroup
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                value={field.value}
                onValueChange={field.onChange}
              >
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    selected={field.value === course.id}
                    onClick={() => field.onChange(course.id)}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* --- Payment Method Selection --- */}
      <FormField
        control={control}
        name="payment_method"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <FormLabel className="text-base font-semibold">
              Kies je betaalmethode
            </FormLabel>
            <FormControl>
              <RadioGroup
                className="flex flex-col gap-4"
                value={field.value}
                onValueChange={field.onChange}
              >
                {paymentOptions.map((option) => (
                  <PaymentMethodCard
                    key={option.id}
                    icon={option.icon}
                    label={option.label}
                    description={option.description}
                    selected={field.value === option.id}
                    onClick={() => field.onChange(option.id)}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

// New helper component for the course cards
function CourseCard({ course, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between p-4 rounded-lg border-2 cursor-pointer transition-all h-full ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input hover:border-primary/50'
      }`}
    >
      <div>
        <course.icon
          className={`h-8 w-8 mb-3 ${
            selected ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
        <h4 className="font-semibold">{course.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {course.description}
        </p>
      </div>
      <p className="text-sm font-semibold mt-4">{course.price}</p>
    </div>
  );
}

// Helper component for the payment method cards
function PaymentMethodCard({ icon, label, description, selected, onClick }) {
  const Icon = icon;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input hover:border-primary/50'
      }`}
    >
      <Icon
        className={`size-8 flex-shrink-0 ${
          selected ? 'text-primary' : 'text-muted-foreground'
        }`}
      />
      <div className="flex-grow">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
// small helpers
function FormText({ name, label, control, ...rest }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} {...rest} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function RoleIcon({ role, label, selected, onClick }) {
  const Icon =
    role === 'student'
      ? selected
        ? StudentIconSelected
        : StudentIcon
      : selected
      ? TeacherIconSelected
      : TeacherIcon;

  return (
    <div
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/10'
          : 'border-input hover:border-primary/50'
      }`}
    >
      <Icon className="size-20" />
      <span
        className={`font-medium text-sm ${
          selected ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function LabelPill({ children, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {children}
    </div>
  );
}
