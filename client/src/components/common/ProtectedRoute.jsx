import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  console.log('🟡 ProtectedRoute: Checking access - loading:', loading, 'user:', user ? 'exists' : 'null');

  if (loading) {
    console.log('🟡 ProtectedRoute: Still loading...');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    console.log('🟡 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🟡 ProtectedRoute: User authenticated, allowing access');
  return children;
}
