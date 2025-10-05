import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { strength } from '../form/helpers';

function StepAccount({ control }) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Inloggegevens</h3>

      <FormField
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>E-mailadres</FormLabel>
            <FormControl>
              <Input
                placeholder="naam@voorbeeld.nl"
                {...field}
                autoComplete="email"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Wachtwoord</FormLabel>
            <div className="relative">
              <Input
                type={show ? 'text' : 'password'}
                placeholder="Minimaal 8 tekens"
                {...field}
                autoComplete="new-password"
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
            {fieldState.isDirty && (
              <>
                <div className="mt-2 h-1.5 w-full rounded bg-muted">
                  <div
                    className={`h-1.5 rounded transition-all ${
                      [
                        'bg-red-500',
                        'bg-orange-500',
                        'bg-yellow-500',
                        'bg-green-500',
                        'bg-green-600',
                      ][strength(field.value || '').score]
                    }`}
                    style={{
                      width: `${
                        (strength(field.value || '').score / 4) * 100
                      }%`,
                    }}
                  />
                </div>
                <FormDescription>
                  Sterkte: {strength(field.value || '').label}
                </FormDescription>
              </>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

StepAccount.propTypes = {
  control: PropTypes.object.isRequired,
};

export default StepAccount;
