import PropTypes from 'prop-types';

function CourseCard({ course, selected, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`flex flex-col justify-between p-4 rounded-lg border-2 cursor-pointer transition-all h-full ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-input hover:border-primary/50'
      }`}
    >
      <div>
        <course.icon
          className={`h-8 w-8 mb-3 ${
            selected ? 'text-primary' : 'text-muted-foreground'
          }`}
        />
        <h4 className="font-semibold">{course.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">
          {course.description}
        </p>
      </div>
      <p className="text-sm font-semibold mt-4">{course.price}</p>
    </div>
  );
}

CourseCard.propTypes = {
  course: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
  }).isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default CourseCard;
