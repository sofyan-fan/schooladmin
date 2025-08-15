import PropTypes from 'prop-types';

function PaymentMethodCard({ icon, label, description, selected, onClick }) {
  const Icon = icon;
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition-all ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input hover:border-primary/50'
      }`}
    >
      <Icon
        className={`size-8 flex-shrink-0 ${
          selected ? 'text-primary' : 'text-muted-foreground'
        }`}
      />
      <div className="flex-grow">
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

PaymentMethodCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default PaymentMethodCard;
