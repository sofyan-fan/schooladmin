import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { defaultValues } from './form/defaults';
import { coerceToIso } from './form/helpers';
import {
  schemaAccount,
  schemaEnrollStudent,
  schemaParentContact,
  schemaPersonalStudent,
  schemaPersonalTeacher,
} from './form/schemas';

import {
  StepAccount,
  StepEnroll,
  StepParentContact,
  Stepper,
  StepPersonal,
} from './ui';

export default function RegisterWizard() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [formError, setFormError] = useState('');

  const [currentRole, setCurrentRole] = useState('student');
  const isStudentFlow = currentRole === 'student';
  const totalSteps = isStudentFlow ? 4 : 2;

  const studentStepInfo = [
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
      description: 'Kies een lespakket en voltooi de inschrijving.',
    },
  ];

  const teacherStepInfo = [
    { title: 'Registreren', description: 'Maak een nieuw account aan.' },
    {
      title: 'Persoonlijke Gegevens',
      description: 'Vul uw persoonlijke en contactgegevens in.',
    },
  ];

  const stepInfo = useMemo(() => {
    return isStudentFlow ? studentStepInfo : teacherStepInfo;
  }, [isStudentFlow]);

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
    reValidateMode: 'onSubmit',
    shouldUnregister: false,
  });

  const { handleSubmit, trigger, watch, control, getValues } = methods;

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
    if (step === 2 && isStudentFlow)
      return ['parentName', 'address', 'city', 'postalCode', 'phone'];
    if (step === 3 && isStudentFlow)
      return ['lesson_package', 'payment_method'];
    return [];
  }, [step, isStudentFlow]);

  const next = async () => {
    const ok = await trigger(currentFields);
    if (ok && step < totalSteps - 1) setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const onSubmit = async () => {
    setFormError('');
    try {
      const roleValue = getValues('role') || currentRole || 'student';
      const email = getValues('email');
      const password = getValues('password');
      const firstName = getValues('firstName');
      const lastName = getValues('lastName');
      const birthDate = getValues('birthDate');
      const gender = getValues('gender');
      const address = getValues('address');
      const city = getValues('city');
      const postalCode = getValues('postalCode');
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

      const profileData = {
        first_name: firstName || '',
        last_name: lastName || '',
        birth_date,
        gender: gender || '',
        address: address || '',
        postal_code: postalCode || '',
        city: city || '',
        phone: phone || '',
        parent_name: parentName || '',
        parent_email: email,
        lesson_package: lessonPkg || '',
        payment_method: payMethod || null,
      };

      console.log('SUBMIT payload', {
        email,
        password,
        roleValue,
        ...profileData,
      });

      const success = await register(email, password, roleValue, profileData);

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
        <div className="bg-muted/30 p-8 border-r flex flex-col justify-between ">
          <Stepper step={step} role={watchedRole || 'student'} />
        </div>

        <div className="p-8">
          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{currentStepInfo.title}</h1>
              <p className="text-muted-foreground mt-1">
                {currentStepInfo.description}
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
          </div>
        </div>
      </div>
    </div>
  );
}
