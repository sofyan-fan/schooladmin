import PropTypes from 'prop-types';
import FormText from './FormText';

function StepParentContact({ control }) {
  return (
    <div className="space-y-6">
     
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

StepParentContact.propTypes = {
  control: PropTypes.object.isRequired,
};

export default StepParentContact;
