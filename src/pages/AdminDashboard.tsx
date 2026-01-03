import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Redirect to unified admin panel
const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin', { replace: true });
  }, [navigate]);

  return null;
};

export default AdminDashboard;
