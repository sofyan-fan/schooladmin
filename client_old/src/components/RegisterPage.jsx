import { useState } from 'react';
import { Link } from 'react-router-dom';

function RegisterPage({ handleRegister, loading, error, message }) {
  const [formData, setFormData] = useState({
    firstname: 'John',
    lastname: 'Doe',
    email: 'johne@example.com',
    password: 'john123',
    phone: '123-456-7890',
    adress: '123 Main St, Anytown',
    gender: 'Male',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleRegister(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
          Create Account
        </h1>
        <form onSubmit={onSubmit}>
          {/* Form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="First Name"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
            />
            <InputField
              label="Last Name"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="md:col-span-2"
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="md:col-span-2"
            />
            <InputField
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
            <InputField
              label="Address"
              name="adress"
              value={formData.adress}
              onChange={handleChange}
            />
            {/* <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
             
              </select>
            </div> */}
               <div className="flex gap-6 px-4 py-2">
                  <InputField
                    label="Male"
                    name="gender"
                    type="radio"
                    value="Male"
                    checked={formData.gender === "Male"}
                    onChange={handleChange}
                    className="flex items-center gap-2"
                  />
                  <InputField
                    label="Female"
                    name="gender"
                    type="radio"
                    value="Female"
                    checked={formData.gender === "Female"}
                    onChange={handleChange}
                    className="flex items-center gap-2"
                  />
                </div>
          </div>

          {/* Messages and button */}
          {error && (
            <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
          )}
          {message && (
            <p className="text-green-500 text-sm mt-4 text-center">{message}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="text-center text-gray-600 mt-4 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

// Helper component for form inputs to reduce repetition
function InputField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  className = '',
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="block text-gray-700 mb-2">
        {label}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default RegisterPage;
