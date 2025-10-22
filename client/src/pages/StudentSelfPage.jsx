import RequestHandler from '@/apis/RequestHandler';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';

const StudentSelfPage = () => {
  const { user } = useAuth();

  const studentId = useMemo(() => {
    return user?.studentId || user?.data?.id || null;
  }, [user]);

  const [resolvedStudentId, setResolvedStudentId] = useState(studentId);
  const [isLoading, setIsLoading] = useState(false);
  const [, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function resolveSelf() {
      if (studentId || !user) return;
      setIsLoading(true);
      setLoadError('');
      try {
        const resp = await RequestHandler.get('/auth/me/student');
        const s = resp?.data;
        if (!cancelled && s?.id) {
          setResolvedStudentId(s.id);
        }
      } catch {
        if (!cancelled) setLoadError('');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    resolveSelf();
    return () => {
      cancelled = true;
    };
  }, [studentId, user]);

  if (resolvedStudentId) {
    return (
      <Navigate
        to={`/mijn-profiel/leerling/${String(resolvedStudentId)}`}
        replace
      />
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-2">
        {isLoading ? 'Profiel laden…' : 'Profiel niet gevonden'}
      </h2>
      {!isLoading && (
        <p className="text-muted-foreground">
          We kunnen je leerlingprofiel nu niet koppelen aan je account. Neem
          contact op met de administratie om je profiel te laten koppelen, of
          probeer opnieuw in te loggen.
        </p>
      )}
    </div>
  );
};

export default StudentSelfPage;
