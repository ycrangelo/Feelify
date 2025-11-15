import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageBackground,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { useUser } from "../context/userContext";

const CLIENT_ID = "d5fe7c7c327b47639da33e95a1c464e1";
const SCOPES =
  "user-read-email user-read-private playlist-modify-public playlist-modify-private";
const REDIRECT_URI = "exp://192.168.18.49:8081/--/redirect";
const BACKEND_URL = "https://feelifybackend.onrender.com/";

const buildAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: Math.random().toString(36).substring(7),
    show_dialog: "true",
  });
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export default function Index() {
  const [loading, setLoading] = useState(false);
  const [backendLoading, setBackendLoading] = useState(true);
  const router = useRouter();
  const { setUser } = useUser();

  // ⚡ Check if backend is online
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(BACKEND_URL);
        if (!response.ok) throw new Error("Backend not reachable");
        setBackendLoading(false);
      } catch (err) {
        console.error("Backend not available:", err);
        setBackendLoading(true);
        Alert.alert("Backend is not yet started", "Please try again later.");
      }
    };
    checkBackend();
  }, []);

  // ⚡ Handle deep links from Spotify
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
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
        await exchangeCodeForToken(code);
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  const exchangeCodeForToken = async (code: string) => {
    try {
      setLoading(true);

      // Exchange code for Spotify token
      const response = await fetch(`${BACKEND_URL}api/v1/auth/spotify/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (!data.access_token) {
        Alert.alert("Failed to exchange token", JSON.stringify(data));
        return;
      }

      // Get user profile from Spotify
      const profileResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const profileData = await profileResponse.json();

      const userObj = {
        display_name: profileData.display_name,
        spotify_id: profileData.id,
        token: data.access_token,
        country: profileData.country,
        avatar: profileData.images?.[0]?.url || null,
      };
     console.log("🎵 Spotify Profile Image:", userObj.avatar);
     console.log("🟢 Spotify Granted Scopes:", profileData);

      // Check if user exists in backend
      const userCheckResponse = await fetch(
        `${BACKEND_URL}api/v1/user/getBy/${profileData.id}`
      );

      if (userCheckResponse.status === 404) {
        // User not found → go to Genre page
        setUser(userObj);
        router.replace("/Genres");
      } else if (userCheckResponse.ok) {


        setUser(userObj);

          // Has genres → go Home
          router.replace("/Home");
        
      } else {
        throw new Error(`User check failed: ${userCheckResponse.status}`);
      }
    } catch (err) {
      console.error("Error exchanging code for token:", err);
      Alert.alert("Error", "Token exchange or user check failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const authUrl = buildAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      if (result.type === "cancel") setLoading(false);
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication failed", "Please try again.");
      setLoading(false);
    }
  };

  if (backendLoading) {
    return (
      <ImageBackground
        source={require("../assets/background.jpg")}
        style={styles.background}
        blurRadius={6}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Starting the application...</Text>
          <Text
            style={[styles.loadingText, { marginTop: 12, fontSize: 16, opacity: 0.8 }]}
          >
            Thank you for waiting!
          </Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require("../assets/background.jpg")}
      style={styles.background}
      blurRadius={6}
    >
      <View style={styles.overlay}>
        <Text style={styles.logoText}>Feelify</Text>
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
            <Image
              source={require("../assets/spotify_icon.png")}
              style={styles.icon}
            />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#1DB954",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});
