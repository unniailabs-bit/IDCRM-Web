import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axiosInstance from '@/api/axiosInstance';

export default function StudentIdCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Student ID is missing.');
      setLoading(false);
      return;
    }

    axiosInstance
      .get(`/api/student/public/${id}`)
      .then((res) => {
        const student = res.data?.student || res.data?.data || res.data;
        if (!student?.form_token) {
          setError('Student verification token is unavailable.');
          return;
        }

        navigate(`/verify/${encodeURIComponent(student.form_token)}`, { replace: true });
      })
      .catch((requestError) => {
        console.error('Could not resolve student verification URL:', requestError);
        setError('Could not load student details.');
        toast.error('Could not load student details.');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F5F3FF' }}>
      <p style={{ color: error ? '#E53935' : '#7C4DFF', fontWeight: 600 }}>
        {error || (loading ? 'Opening student details…' : 'Redirecting to student details…')}
      </p>
    </main>
  );
}
