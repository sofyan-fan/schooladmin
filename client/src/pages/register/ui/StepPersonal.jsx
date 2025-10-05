import { DatePicker } from '@/components/ui/date-picker';
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RadioGroup } from '@/components/ui/radio-group';
import PropTypes from 'prop-types';
import FormText from './FormText';
import LabelPill from './LabelPill';

function StepPersonal({ control, role }) {
  return (
    <div className="space-y-6">
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
          render={({ field, fieldState }) => (
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
          render={({ field, fieldState }) => (
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormText
              name="phone"
              label="Telefoonnummer"
              placeholder="+31 6 12345678"
              control={control}
            />
            <FormText
              name="sosnumber"
              label="SOS-nummer"
              placeholder="1234567890"
              control={control}
            />
          </div>
        </>
      )}
    </div>
  );
}

StepPersonal.propTypes = {
  control: PropTypes.object.isRequired,
  role: PropTypes.string.isRequired,
};

export default StepPersonal;
