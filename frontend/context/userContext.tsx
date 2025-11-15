import React, { createContext, useState, useContext, ReactNode } from "react";

// hape of user data
type User = {
  display_name: string;
  id:string;
  token:string;
  country:string;
  genres: string[]
  avatar: string
} | null;

//  context value type
type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

// 3 context with a proper default
const UserContext = createContext<UserContextType | undefined>(undefined);

//  Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for easy usage
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
