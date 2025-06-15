import React, { createContext, useContext, useEffect, useState } from 'react';
import {auth} from "../services/firebase" ;

interface AuthContextType {
  isAuthenticated: boolean;
  userId: string | null;
  loading: boolean;
  login: (uid: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userId: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: any) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (uid: string) => {
    setIsAuthenticated(true);
    setUserId(uid);
  };
  const logout = () => {
    setIsAuthenticated(false);
    setUserId(null);
    auth.signOut().catch((error) => {
      console.error("Error signing out: ", error);
    });
  }

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if(user){
        login(user.uid);
      }else{
        logout();
      }
      setLoading(false);
    });
    return () => unsubscribe();
  },[]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
