import PropTypes from 'prop-types';
import FormText from './FormText';

function StepParentContact({ control, showError = false }) {
  return (
    <div className="space-y-6">
      <FormText
        name="parentName"
        label="Volledige Naam Ouder/Verzorger"
        placeholder="Naam"
        control={control}
        showError={showError}
      />
      <FormText
        name="address"
        label="Adres"
        placeholder="Straat en huisnummer"
        control={control}
        showError={showError}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormText
          name="city"
          label="Woonplaats"
          placeholder="Bijv. Rotterdam"
          control={control}
          showError={showError}
        />
        <FormText
          name="postalCode"
          label="Postcode"
          placeholder="1234 AB"
          control={control}
          showError={showError}
        />
      </div>
      <FormText
        name="phone"
        label="Telefoonnummer"
        placeholder="+31 6 12345678"
        control={control}
        showError={showError}
      />
    </div>
  );
}

StepParentContact.propTypes = {
  control: PropTypes.object.isRequired,
  showError: PropTypes.bool,
};

export default StepParentContact;
