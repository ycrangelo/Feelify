// app/redirect.tsx
import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function RedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // This component handles the OAuth redirect
    // The actual authentication is handled by the response in index.tsx
    console.log('Redirect handler mounted');
    
    // Navigate back to the main screen after a short delay
    const timer = setTimeout(() => {
      router.replace('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Text style={{ color: '#fff' }}>Completing authentication...</Text>
    </View>
  );
}