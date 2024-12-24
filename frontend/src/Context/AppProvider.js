import { createContext, useState } from "react";

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: '',
    name: '',
    current_id: '',
    user_id: '',
    email: '',
    joined_date: '',
    profile_picture: '',
    role: '',
    subjectsData: [],
  });
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isSignedIn,
        setIsSignedIn,
        loading,
        setLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const AppContext = createContext();
