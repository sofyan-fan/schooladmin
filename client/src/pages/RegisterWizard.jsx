import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

// shadcn/ui
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import femaleSelected from '@/assets/gender_icons/female/selected.svg';
import femaleUnselected from '@/assets/gender_icons/female/unselected.svg';
import maleSelected from '@/assets/gender_icons/male/selected.svg';
import maleUnselected from '@/assets/gender_icons/male/unselected.svg';
import { DatePicker } from '@/components/ui/date-picker';

// ---------------- schemas ----------------
const schemaAccount = z.object({
  role: z.enum(['student', 'teacher']),
  email: z.string().email('Voer een geldig e-mailadres in'),
  password: z.string().min(8, 'Minimaal 8 tekens'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Je moet akkoord gaan met de voorwaarden' }),
  }),
});

const schemaPersonal = z
  .object({
    // Student details
    firstName: z.string().min(1, 'Verplicht'),
    lastName: z.string().min(1, 'Verplicht'),
    birthDate: z.string().min(1, 'Verplicht'),
    gender: z.enum(['Man', 'Vrouw']).optional(),

    // Contact details
    address: z.string().min(1, 'Verplicht'),
    city: z.string().min(1, 'Verplicht'),
    postalCode: z.string().min(1, 'Verplicht'),
    phone: z.string().min(6, 'Te kort'),

    // Parent details (only for student role)
    parentName: z.string().optional(),
  })
  .refine(() => {
    // This validation logic is now part of the component's `next` function
    // to accommodate multi-step validation with role changes.
    // If we were validating the whole form at once, we'd do it here.
    return true;
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
  acceptTerms: false,
  // step 2
  firstName: '',
  lastName: '',
  birthDate: '',
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
const courses = [
  { id: 'Arabisch – Beginner', label: 'Arabisch – Beginner' },
  { id: 'Tajwīd', label: 'Tajwīd' },
  { id: 'Fiqh (basics)', label: 'Fiqh (basics)' },
];

// ---------------- main ----------------
export default function RegisterWizard() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState('');

  const role = useForm().watch('role', 'student');

  const isStudentFlow = role === 'student';
  const totalSteps = isStudentFlow ? 3 : 2;

  const schemas = [
    schemaAccount,
    schemaPersonal,
    ...(isStudentFlow ? [schemaEnrollStudent] : []),
  ];

  const methods = useForm({
    resolver: zodResolver(schemas[step]),
    defaultValues,
    mode: 'onChange',
  });

  const { handleSubmit, trigger, watch, control, getValues } = methods;

  const watchedRole = watch('role');

  const currentFields = useMemo(() => {
    if (step === 0) return ['role', 'email', 'password', 'acceptTerms'];
    if (step === 1)
      return [
        'firstName',
        'lastName',
        'birthDate',
        'gender',
        'address',
        'city',
        'postalCode',
        'phone',
        'parentName',
      ];
    if (step === 2 && watchedRole === 'student')
      return ['lesson_package', 'payment_method'];
    return [];
  }, [step, watchedRole]);

  const next = async () => {
    // Custom validation for parent name if role is student
    if (step === 1 && watchedRole === 'student' && !getValues('parentName')) {
      methods.setError('parentName', {
        type: 'manual',
        message: 'Naam van ouder/verzorger is verplicht.',
      });
      return;
    }
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
        birth_date: new Date(studentDetails.birthDate).toISOString(),
        gender: studentDetails.gender,
        address: studentDetails.address,
        postal_code: studentDetails.postalCode,
        city: studentDetails.city,
        phone: studentDetails.phone,
        parent_name: studentDetails.parentName,
        parent_email: email, // The account email is the parent's email
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
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border bg-background p-6 shadow-sm">
        <h1 className="text-3xl font-bold">Registreren</h1>
        <p className="text-muted-foreground mt-1">Maak een nieuw account aan</p>

        <Stepper step={step} role={watchedRole} />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            {step === 0 && <StepAccount control={control} watch={watch} />}
            {step === 1 && <StepPersonal control={control} watch={watch} />}
            {step === 2 && isStudentFlow && <StepEnroll control={control} />}

            {formError && <p className="text-sm text-red-600">{formError}</p>}

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
  );
}

// ---------------- UI parts ----------------
function Stepper({ step, role }) {
  const studentSteps = ['Account', 'Gegevens Leerling', 'Inschrijving'];
  const teacherSteps = ['Account', 'Persoonlijke Gegevens'];
  const steps = role === 'student' ? studentSteps : teacherSteps;

  return (
    <div className="mt-5 grid grid-cols-3 items-center gap-4 text-sm">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`grid h-6 w-6 place-items-center rounded-full border text-xs ${
              i <= step ? 'bg-primary text-white border-primary' : 'bg-muted'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`${
              i === step ? 'font-medium' : 'text-muted-foreground'
            }`}
          >
            {label}
          </span>
        </div>
      ))}
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
                className="flex gap-3"
                value={field.value}
                onValueValueChange={field.onChange}
              >
                {[
                  { id: 'student', label: 'Ouder (namens Leerling)' },
                  { id: 'teacher', label: 'Docent' },
                ].map((r) => (
                  <LabelPill
                    key={r.id}
                    value={r.id}
                    selected={field.value === r.id}
                    onClick={() => field.onChange(r.id)}
                  >
                    {r.label}
                  </LabelPill>
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
            <FormLabel>E-mailadres Ouder/Verzorger</FormLabel>
            <FormControl>
              <Input placeholder="naam@voorbeeld.nl" {...field} />
            </FormControl>
            <FormDescription>Dit wordt uw login-e-mail.</FormDescription>
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
                className={`h-1.5 rounded ${
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

      <FormField
        control={control}
        name="acceptTerms"
        render={({ field }) => (
          <FormItem className="flex items-start gap-3 pt-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="font-normal">
                Ik ga akkoord met de{' '}
                <Link className="underline" to="/voorwaarden">
                  voorwaarden
                </Link>{' '}
                en het privacybeleid.
              </FormLabel>
              <FormMessage />
            </div>
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
                value={field.value}
                onChange={field.onChange}
                props={{
                  captionLayout: 'dropdown-buttons',
                  fromYear: 1950,
                  toYear: new Date().getFullYear(),
                }}
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
                className="flex gap-5"
                value={field.value}
                onValueChange={field.onChange}
              >
                <GenderIcon
                  value="Man"
                  label="Man"
                  selected={field.value === 'Man'}
                  onClick={() => field.onChange('Man')}
                  selectedIcon={maleSelected}
                  unselectedIcon={maleUnselected}
                />
                <GenderIcon
                  value="Vrouw"
                  label="Vrouw"
                  selected={field.value === 'Vrouw'}
                  onClick={() => field.onChange('Vrouw')}
                  selectedIcon={femaleSelected}
                  unselectedIcon={femaleUnselected}
                />
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {role === 'student' && (
        <>
          <h3 className="text-lg font-semibold border-b pb-2 mt-6">
            Gegevens Ouder/Verzorger & Contact
          </h3>
          <FormText
            name="parentName"
            label="Volledige Naam Ouder/Verzorger"
            placeholder="Naam"
            control={control}
          />
        </>
      )}

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

function StepEnroll({ control }) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Schoolgegevens</h3>
      <FormField
        control={control}
        name="lesson_package"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Lespakket</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Kies lespakket" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {courses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="payment_method"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Betaalmethode</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Kies betaalmethode" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="SEPA incasso">SEPA incasso</SelectItem>
                <SelectItem value="iDEAL">iDEAL</SelectItem>
                <SelectItem value="Contant">Contant</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

function GenderIcon({
//   value,
  label,
  selected,
  onClick,
  selectedIcon,
  unselectedIcon,
}) {
  return (
    <div
      className="flex cursor-pointer flex-col items-center gap-2"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          onClick();
        }
      }}
      role="radio"
      aria-checked={selected}
      tabIndex={0}
    >
      <img
        src={selected ? selectedIcon : unselectedIcon}
        alt={label}
        className="size-10"
      />
      <span
        className={`text-sm font-medium ${
          selected ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
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

function LabelPill({ children, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-state={selected ? 'checked' : 'unchecked'}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors
        ${
          selected
            ? 'bg-primary text-primary-foreground border-transparent'
            : 'hover:bg-accent hover:text-accent-foreground'
        }`}
    >
      {children}
    </button>
  );
}
