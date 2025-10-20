import { Stack } from 'expo-router';
import {UserProvider} from '../context/userContext'

export default function RootLayout() {
  return (
      // <UserProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
          </Stack>
      // </UserProvider>
  );
}
