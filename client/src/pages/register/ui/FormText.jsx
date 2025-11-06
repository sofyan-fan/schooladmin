import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import PropTypes from 'prop-types';
import { useFormContext } from 'react-hook-form';

function FormText({ name, label, control, ...rest }) {
  const { formState } = useFormContext();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem>
          <FormLabel htmlFor={name}>{label}</FormLabel>
          <FormControl>
            <Input id={name} {...field} {...rest} autoComplete="off" />
          </FormControl>
          {fieldState.error &&
            (formState.submitCount > 0 || fieldState.isTouched || fieldState.isDirty) && (
              <FormMessage>{fieldState.error.message}</FormMessage>
            )}
        </FormItem>
      )}
    />
  );
}

FormText.propTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
};

export default FormText;
