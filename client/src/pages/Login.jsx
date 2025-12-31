import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FcGoogle } from 'react-icons/fc';
import toast from 'react-hot-toast';

export default function Login() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🟢 Login: useEffect triggered, user:', user);
    if (user) {
      console.log('🟢 Login: User exists, navigating to dashboard');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    try {
      console.log('🟢 Login: Starting Google sign-in...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('🟢 Login: Google sign-in successful', result.user.email);
      console.log('🟢 Login: Waiting for AuthContext to sync user...');
      toast.success('Logged in successfully!');
      // Don't navigate here - let the useEffect handle it after AuthContext syncs
    } catch (error) {
      console.error('❌ Login: Login error:', error);
      toast.error(error.message || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Task Manager</h1>
          <p className="text-gray-600">Sign in to manage your tasks</p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
        >
          <FcGoogle size={24} />
          Sign in with Google
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Sign in with your Google account to continue
        </p>
      </div>
    </div>
  );
}
