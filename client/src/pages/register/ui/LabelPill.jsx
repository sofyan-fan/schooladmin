import PropTypes from 'prop-types';

function LabelPill({ children, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input hover:bg-accent hover:text-accent-foreground'
      }`}
    >
      {children}
    </div>
  );
}

LabelPill.propTypes = {
  children: PropTypes.node.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default LabelPill;
