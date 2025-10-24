import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const RequireRole = ({
  allowedRoles = [],
  redirectTo = '/dashboard',
  children,
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // While auth is known to be authenticated but user not yet loaded from storage,
  // render nothing to preserve the current route without redirect flicker.
  if (isAuthenticated && !user) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const normalizedAllowed = Array.isArray(allowedRoles)
    ? allowedRoles.map((r) => String(r).toLowerCase())
    : [];
  const userRole = (user?.role || '').toLowerCase();

  // If no allowedRoles specified, allow all authenticated users
  if (normalizedAllowed.length === 0 || normalizedAllowed.includes(userRole)) {
    return children ? children : <Outlet />;
  }

  return <Navigate to={redirectTo} replace state={{ from: location }} />;
};

export default RequireRole;
