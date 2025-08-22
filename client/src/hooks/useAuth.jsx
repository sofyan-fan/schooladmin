import { use } from 'react';
import { AuthContext } from '../contexts/auth';

export const useAuth = () => {
  return use(AuthContext);
};
