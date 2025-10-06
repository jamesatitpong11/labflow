import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: { username: string; firstName: string; lastName: string; phone: string } | null;
  validateSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ username: string; firstName: string; lastName: string; phone: string } | null>(null);
  
  // Auto logout disabled - users must manually logout

  // Check for existing session on app start
  useEffect(() => {
    const savedAuth = localStorage.getItem('labflow_auth');
    if (savedAuth) {
      const authData = JSON.parse(savedAuth);
      setIsAuthenticated(true);
      setUser(authData.user);
      
      // Optional: Validate session on startup (can be disabled if not needed)
      // validateSession();
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Check if we're in Electron and use appropriate API
      const isElectron = typeof window !== 'undefined' && 
                        (window.electronAPI || 
                         (window as any).electron || 
                         navigator.userAgent.includes('Electron'));
      
      let apiUrl;
      
      if (isElectron) {
        // Force use correct URL in Electron
        apiUrl = 'http://localhost:3001/api/auth/login';
        console.log('AuthContext: Using Electron API URL:', apiUrl);
      } else {
        // Use environment variable or relative URL for web
        const baseUrl = import.meta.env.VITE_API_URL;
        if (baseUrl && baseUrl.startsWith('http')) {
          apiUrl = `${baseUrl}/api/auth/login`;
        } else {
          apiUrl = '/api/auth/login';
        }
        console.log('AuthContext: Using web API URL:', apiUrl);
      }
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          username: data.user.username,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone
        };
        
        setIsAuthenticated(true);
        setUser(userData);
        
        // Save to localStorage with session info
        localStorage.setItem('labflow_auth', JSON.stringify({
          isAuthenticated: true,
          user: userData,
          sessionId: data.sessionId,
          username: data.user.username
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const validateSession = async (): Promise<boolean> => {
    try {
      const savedAuth = localStorage.getItem('labflow_auth');
      if (!savedAuth) {
        return false;
      }

      const authData = JSON.parse(savedAuth);
      if (!authData.sessionId || !authData.username) {
        logout();
        return false;
      }

      const response = await fetch('/api/auth/validate', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': authData.sessionId,
          'x-username': authData.username
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          // Update user data if needed
          setUser(data.user);
          return true;
        }
      }

      // Session invalid, logout
      const errorData = await response.json();
      console.log('Session validation failed:', errorData.message);
      logout();
      return false;
    } catch (error) {
      console.error('Session validation error:', error);
      logout();
      return false;
    }
  };

  const logout = async () => {
    try {
      const savedAuth = localStorage.getItem('labflow_auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        
        // Call logout API to clear server session
        if (authData.username) {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-username': authData.username
            }
          });
        }
      }
    } catch (error) {
      console.error('Logout API error:', error);
    }

    console.log('Logging out user...');
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('labflow_auth');
    console.log('User logged out successfully');
  };

  const value = {
    isAuthenticated,
    login,
    logout,
    user,
    validateSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
