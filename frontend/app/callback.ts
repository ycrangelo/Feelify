// app/redirect.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as AuthSession from 'expo-auth-session';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // This screen just handles the redirect
    // The actual token handling happens in the index page via the response object
    setTimeout(() => {
      router.back(); // Go back to the login screen
    }, 1000);
  }, []);

  return null;
}