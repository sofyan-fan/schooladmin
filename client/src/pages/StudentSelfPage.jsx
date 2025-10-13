import { useAuth } from '@/hooks/useAuth';
import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';

const StudentSelfPage = () => {
  const { user } = useAuth();

  const studentId = useMemo(() => {
    return user?.studentId || user?.data?.id || null;
  }, [user]);

  if (studentId) {
    return <Navigate to={`/leerlingen/${String(studentId)}`} replace />;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">Profiel niet gevonden</h2>
      <p className="text-muted-foreground">
        We kunnen je leerlingprofiel nu niet koppelen aan je account. Neem
        contact op met de administratie om je profiel te laten koppelen, of
        probeer opnieuw in te loggen.
      </p>
    </div>
  );
};

export default StudentSelfPage;
