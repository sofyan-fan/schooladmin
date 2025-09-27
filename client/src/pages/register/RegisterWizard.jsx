// src/pages/Register/RegisterWizardPage.jsx (or your chosen path)

import studentAPI from '@/apis/studentAPI';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { ValuePropPlaceholder } from '../../components/ValuePropPlaceholder';
import { defaultValues } from './form/defaults';
import { coerceToIso } from './form/helpers';
import {
  schemaAccount,
  schemaEnrollStudent,
  schemaParentContact,
  schemaPersonalStudent,
  schemaPersonalTeacher,
} from './form/schemas';
import RoleSelectionPage from './RoleSelectionPage';
import {
  StepAccount,
  StepEnroll,
  StepParentContact,
  Stepper,
  StepPersonal,
} from './ui';

export default function RegisterWizard({
  initialRole = null,
  lockRole = false,
  silent = false,
  onSuccess,
  createStudentOnly = false,
  inDialog = false,
}) {
  const { register, registerSilently } = useAuth();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState('');

  const [currentRole, setCurrentRole] = useState(initialRole || null);
  const [roleSelected, setRoleSelected] = useState(
    Boolean(lockRole && initialRole)
  );

  useEffect(() => {
    if (lockRole && initialRole) {
      setCurrentRole(initialRole);
      setRoleSelected(true);
    }
  }, [initialRole, lockRole]);
  const isStudentFlow = currentRole === 'student';
  const totalSteps = isStudentFlow ? 4 : 2;

  const handleRoleSelect = (role) => {
    setCurrentRole(role);
  };

  const handleRoleNext = () => {
    if (currentRole) {
      setRoleSelected(true);
    }
  };

  const studentStepInfo = useMemo(
    () => [
      { title: 'Registreren', description: 'Maak een nieuw account aan.' },
      {
        title: 'Gegevens Leerling',
        description: 'Vul de persoonlijke gegevens van de leerling in.',
      },
      {
        title: 'Gegevens Ouder',
        description: 'Vul de gegevens van de ouder/verzorger in.',
      },
      {
        title: 'Inschrijving',
        description: 'Kies een module en voltooi de inschrijving.',
      },
    ],
    []
  );

  const teacherStepInfo = useMemo(
    () => [
      { title: 'Registreren', description: 'Maak een nieuw account aan.' },
      {
        title: 'Persoonlijke Gegevens',
        description: 'Vul uw persoonlijke en contactgegevens in.',
      },
    ],
    []
  );

  const stepInfo = useMemo(() => {
    return isStudentFlow ? studentStepInfo : teacherStepInfo;
  }, [isStudentFlow, studentStepInfo, teacherStepInfo]);

  const currentStepInfo = stepInfo[step];

  const schemas = useMemo(
    () =>
      isStudentFlow
        ? [
            schemaAccount,
            schemaPersonalStudent,
            schemaParentContact,
            schemaEnrollStudent,
          ]
        : [schemaAccount, schemaPersonalTeacher],
    [isStudentFlow]
  );

  const methods = useForm({
    resolver: zodResolver(schemas[step]),
    defaultValues,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  });

  const { handleSubmit, trigger, watch, control, getValues, formState } =
    methods;

  const currentFields = useMemo(() => {
    if (step === 0) return ['email', 'password'];
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
            'sosnumber',
            'phone',
          ];
    }
    if (step === 2 && isStudentFlow)
      return [
        'parentName',
        'address',
        'city',
        'postalCode',
        'phone',
        'sosnumber',
      ];
    if (step === 3 && isStudentFlow)
      return ['lesson_package', 'payment_method'];
    return [];
  }, [step, isStudentFlow]);

  const next = async () => {
    const ok = await trigger(currentFields);
    if (ok && step < totalSteps - 1) {
      setStep((s) => s + 1);
    }
  };

  const back = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const onSubmit = async (data) => {
    console.log('Form submitted', data);
    setFormError('');
    try {
      const roleValue = currentRole;
      const email = getValues('email');
      const password = getValues('password');
      const firstName = getValues('firstName');
      const lastName = getValues('lastName');
      const birthDate = getValues('birthDate');
      const gender = getValues('gender');
      const address = getValues('address');
      const city = getValues('city');
      const postalCode = getValues('postalCode');
      const sosnumber = getValues('sosnumber');
      const phone = getValues('phone');
      const parentName = getValues('parentName');
      const lessonPkg = getValues('lesson_package');
      const payMethod = getValues('payment_method');

      const birth_date = coerceToIso(birthDate);

      if (roleValue === 'student' && !birth_date) {
        setFormError('Geboortedatum is verplicht voor leerlingen.');
        setStep(1);
        return;
      }
      console.log('Submitting with role:', roleValue, 'and data:', data);

      const profileData = {
        first_name: firstName || '',
        last_name: lastName || '',
        address: address || '',
        postal_code: postalCode || '',
        city: city || '',
        phone: phone || '',
        parent_name: parentName || '',
        parent_email: email,
        lesson_package: lessonPkg ? String(lessonPkg) : '',
        payment_method: payMethod || null,
        sosnumber: sosnumber || '',
      };

      if (currentRole === 'teacher') {
        profileData.birth_date = birth_date;
        profileData.gender = gender || '';
      } else if (currentRole === 'student') {
        profileData.birth_date = birth_date;
        profileData.gender = gender || '';
      }

      if (silent && createStudentOnly && roleValue === 'student') {
        // Admin-side creation: only create student profile to avoid session switching
        const created = await studentAPI.add_student(profileData);
        if (!created || !created.id) {
          setFormError('Aanmaken van leerling is mislukt.');
          return;
        }
        if (onSuccess) onSuccess({ student: created });
      } else if (silent) {
        const result = await registerSilently(
          email,
          password,
          roleValue,
          profileData
        );
        if (!result?.ok) {
          setFormError(result?.error || 'Registratie is mislukt.');
          return;
        }
        const createdStudent = result?.data?.user?.data || null;
        if (onSuccess && createdStudent) {
          onSuccess({ student: createdStudent });
        }
      } else {
        const success = await register(email, password, roleValue, profileData);
        console.log('Registration success:', success);
        if (!success) {
          setFormError('Registratie is mislukt. Bestaat het e-mailadres al?');
        }
      }
    } catch (err) {
      console.error('Registration submission error', err);
      setFormError(err?.message || 'Er ging iets mis bij het registreren.');
    }
  };

  if (!roleSelected) {
    return (
      <RoleSelectionPage
        onSelect={handleRoleSelect}
        onNext={handleRoleNext}
        selectedRole={currentRole}
        rightPanelContent={<ValuePropPlaceholder />}
      />
    );
  }

  const outerClasses = inDialog
    ? 'w-full'
    : 'flex items-start justify-center min-h-screen bg-gray-100 dark:bg-gray-950 p-4 pt-10 sm:p-8';

  return (
    <div className={outerClasses}>
      <div className="mx-auto w-full max-w-3xl rounded-2xl border bg-background shadow-sm">
        <div className="space-y-6 p-5 sm:p-8">
          <div>
            <h1 className="text-center text-2xl font-bold sm:text-3xl">
              {currentStepInfo.title}
            </h1>
            <p className="mt-2 text-center text-muted-foreground">
              {currentStepInfo.description}
            </p>
          </div>

          <div className="mt-5">
            <Stepper step={step} role={currentRole} />
          </div>

          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-6">
              {step === 0 && <StepAccount control={control} watch={watch} />}
              {step === 1 && (
                <StepPersonal
                  control={control}
                  watch={watch}
                  role={currentRole}
                />
              )}
              {step === 2 && isStudentFlow && (
                <StepParentContact control={control} />
              )}
              {step === 3 && isStudentFlow && (
                <StepEnroll control={control} formState={formState} />
              )}

              {formError && (
                <p className="text-sm text-red-600 text-center">{formError}</p>
              )}

              <Separator />
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={back}
                  disabled={step === 0}
                  className={step === 0 ? 'invisible' : ''}
                >
                  Terug
                </Button>
                {step < totalSteps - 1 ? (
                  <Button
                    type="button"
                    onClick={next}
                    className="w-full sm:w-auto"
                  >
                    Doorgaan
                  </Button>
                ) : (
                  <Button type="submit" className="w-full sm:w-auto">
                    Registreren
                  </Button>
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
  );
}
