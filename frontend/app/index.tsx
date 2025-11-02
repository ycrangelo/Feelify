import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground, Linking, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { useUser } from "../context/userContext";
import { PINATA_API_KEY, PINATA_SECRET_API_KEY, API_BASE_URL } from '@env';

console.log("✅ Pinata Key:", PINATA_API_KEY);
console.log("✅ Backend URL:", API_BASE_URL);
console.log("✅ PINATA_SECRET_API_KEY URL:", PINATA_SECRET_API_KEY);
// 👇 Spotify Configuration
const CLIENT_ID = "d5fe7c7c327b47639da33e95a1c464e1";
const SCOPES = "user-read-email user-read-private";
const REDIRECT_URI = "exp://192.168.18.49:8081/--/redirect"; // Your Expo deep link redirect
const BACKEND_URL = "https://feelifybackend.onrender.com/"; // Your backend

// 🔗 Build Spotify Auth URL
const buildAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code", // use 'code' to exchange via backend
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: Math.random().toString(36).substring(7),
    show_dialog: "true",
  });

  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export default function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, setUser } = useUser();
  // ⚡ Handle deep links from Spotify
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      console.log("Deep link received:", event.url);

      const url = new URL(event.url);
      const queryParams = new URLSearchParams(url.search);

      const code = queryParams.get("code");
      const error = queryParams.get("error");

      if (error) {
        console.error("Auth error:", error);
        setLoading(false);
        Alert.alert("Authentication failed", error);
        return;
      }

      if (code) {
        console.log("Authorization code received:", code);
        await exchangeCodeForToken(code);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  // 🔁 Exchange authorization code for access token via backend
  const exchangeCodeForToken = async (code: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}api/v1/auth/spotify/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (data.access_token) {
        console.log("✅ Access token received:", data.access_token);
        setToken(data.access_token);

        // 🎧 Fetch Spotify profile info
        const profileResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });

        const profileData = await profileResponse.json();

        // Store in state
        setUser({
          display_name: profileData.display_name,
          id: profileData.id,
          country: profileData.country,
        });

        // Optional alert
        // Alert.alert("Welcome!", `Logged in as ${profileData.display_name || "Spotify User"}`);

        // ✅ Redirect to Home page (you can pass user info here if needed)
        router.replace("/Home");
      } else {
        console.error("❌ Token exchange failed:", data);
        Alert.alert("Failed to exchange token", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error exchanging code for token:", err);
      Alert.alert("Error", "Token exchange failed. Check your backend.");
    } finally {
      setLoading(false);
    }
  };
    useEffect(() => {
    if (user) {
      console.log("🧩 User Context Updated:", user);
    }
  }, [user]);

  // 🟢 Start Spotify login flow
  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log("Starting Spotify authentication...");

      const authUrl = buildAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

      console.log("WebBrowser result:", result);

      if (result.type === "cancel") {
        console.log("User cancelled authentication");
        setLoading(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication failed", "Please try again.");
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require("../assets/background.jpg")} style={styles.background} blurRadius={6}>
      <View style={styles.overlay}>
        <Text style={styles.logoText}>Feelify</Text>

        {/* <Text style={styles.statusText}>
          {token
            ? user
              ? `✅ Welcome, ${user.display_name}!`
              : "✅ Connected!"
            : loading
            ? "🔄 Connecting to Spotify..."
            : "Not connected"}
        </Text> */}

        <Text style={styles.subtitle}>Playlists that match your emotions</Text>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleLogin}
          style={styles.buttonWrapper}
          disabled={loading}
        >
          <LinearGradient
            colors={["#1DB954", "#1ed760"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.loginButton, loading && styles.buttonDisabled]}
          >
            <Image source={require("../assets/spotify_icon.png")} style={styles.icon} />
            <Text style={styles.loginText}>
              {loading ? "Opening Spotify..." : "Continue with Spotify"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <StatusBar style="light" />
      </View>
    </ImageBackground>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#1DB954",
    marginBottom: 10,
    textShadowColor: "rgba(29, 185, 84, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  statusText: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    color: "#fff",
    fontSize: 18,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: "40%",
  },
  buttonWrapper: { width: "80%", borderRadius: 50, overflow: "hidden" },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: "#1DB954",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  icon: { width: 26, height: 26, marginRight: 12, tintColor: "#fff" },
  loginText: { color: "#fff", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
});
