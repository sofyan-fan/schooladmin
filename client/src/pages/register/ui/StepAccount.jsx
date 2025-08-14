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
import { Eye, EyeOff } from 'lucide-react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { strength } from '../form/helpers';
import RoleIcon from './RoleIcon';

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
            <input type="hidden" name={field.name} value={field.value ?? ''} />
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

StepAccount.propTypes = {
  control: PropTypes.object.isRequired,
  watch: PropTypes.func.isRequired,
};

export default StepAccount;
