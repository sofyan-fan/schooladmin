const StatusIndicator = ({ isActive }) => (
  <div className="flex items-center">
    <span
      className={`h-2.5 w-2.5 rounded-full mr-2 ${
        isActive ? 'bg-green-500' : 'bg-red-500'
      }`}
    />
    <span>{isActive ? 'Active' : 'Inactive'}</span>
  </div>
);

export default StatusIndicator;
