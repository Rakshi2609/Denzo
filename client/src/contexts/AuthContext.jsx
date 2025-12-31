import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔵 AuthContext: Setting up auth listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔵 AuthContext: Auth state changed', firebaseUser ? 'User logged in' : 'No user');
      if (firebaseUser) {
        try {
          console.log('🔵 AuthContext: Getting Firebase token...');
          const token = await firebaseUser.getIdToken();
          console.log('🔵 AuthContext: Token obtained, sending to backend...');
          
          // Send token to backend to sync user
          const { data } = await api.post('/auth/login', { 
            token,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
          console.log('🔵 AuthContext: Backend response received', data);
          
          setUser({ ...firebaseUser, ...data.user });
          localStorage.setItem('token', token);
          console.log('🔵 AuthContext: User state updated, user logged in');
        } catch (error) {
          console.error('❌ AuthContext: Auth error:', error);
          setUser(null);
        }
      } else {
        console.log('🔵 AuthContext: No user, clearing state');
        setUser(null);
        localStorage.removeItem('token');
      }
      
      console.log('🔵 AuthContext: Loading complete, user:', user ? 'logged in' : 'not logged in');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
