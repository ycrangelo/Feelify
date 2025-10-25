import { Stack } from 'expo-router';
import {UserProvider} from '../context/userContext'

export default function RootLayout() {
  return (
       <UserProvider>
          <Stack 
            screenOptions={{
              headerShown: false,
              animation: "fade_from_bottom",
              contentStyle: { backgroundColor: "#000" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="home" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="createPlaylist" />
          </Stack>
       </UserProvider>
  );
}
