import React, { createContext, useState, useContext, ReactNode } from "react";

// 1. Define the shape of user data
type User = {
  display_name: string;
  id:string;
  token:string;
  country:string;
  genres: string[]
  avatar: string
} | null;

// 2. Define context value type
type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

// 3. Create context with a proper default
const UserContext = createContext<UserContextType | undefined>(undefined);

// 4. Provider component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// 5. Custom hook for easy usage
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
