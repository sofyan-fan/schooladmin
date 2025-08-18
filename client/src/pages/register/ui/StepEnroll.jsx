import courseApi from '@/apis/courses/courseAPI';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup } from '@/components/ui/radio-group';
import {
  BookOpenCheck,
  CreditCard,
  HandCoins,
  Info,
  Landmark,
} from 'lucide-react';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import CourseCard from './CourseCard';
import PaymentMethodCard from './PaymentMethodCard';

function StepEnroll({ control, formState }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const data = await courseApi.get_courses();
        setCourses(data);
      } catch (err) {
        setError('Failed to load courses.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

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

  if (loading) {
    return <div>Laden...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="space-y-8">
      <FormField
        control={control}
        name="lesson_package"
        render={({ field }) => (
          <FormItem className="space-y-4">
            <div className="flex justify-between items-center">
              <FormLabel className="text-xl text-black font-semibold ">
                Lespakketten
              </FormLabel>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="p-1 bg-transparent hover:bg-transparent hover:border-b-1 hover:border-primary rounded-none text-base text-primary shadow-none transform transition-all duration-[50ms]">
                    <Info className="size-5" />
                    Bekijk details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px]">
                  <DialogHeader>
                    <DialogTitle>Details Lespakketten</DialogTitle>
                    <DialogDescription>
                      Hieronder vind je een gedetailleerd overzicht.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    {courses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-start gap-4 p-4 border rounded-lg"
                      >
                        <BookOpenCheck className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                        <div>
                          <h4 className="font-semibold">
                            {course.name} -{' '}
                            <span className="text-muted-foreground">
                              €{course.price}
                            </span>
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {course.description}
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
                    selected={String(field.value) === String(course.id)}
                    onClick={() => field.onChange(String(course.id))}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            {formState.isSubmitted && <FormMessage />}
          </FormItem>
        )}
      />

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
            {formState.isSubmitted && <FormMessage />}
          </FormItem>
        )}
      />
    </div>
  );
}

StepEnroll.propTypes = {
  control: PropTypes.object.isRequired,
  formState: PropTypes.object.isRequired,
};

export default StepEnroll;
