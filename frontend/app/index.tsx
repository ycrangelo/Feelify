import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as WebBrowser from 'expo-web-browser';

// Spotify Config
const CLIENT_ID = "d5fe7c7c327b47639da33e95a1c464e1";
const SCOPES = "user-read-email user-read-private";
const REDIRECT_URI = "exp://192.168.18.49:8081/--/redirect";

// Construct the Spotify authorization URL
const buildAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'token', // Try token first
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: Math.random().toString(36).substring(7),
    show_dialog: 'true'
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Alternative: Try with code response type
const buildAuthUrlWithCode = () => {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: Math.random().toString(36).substring(7),
    show_dialog: 'true'
  });
  
  return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

export default function Index() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle deep links
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      console.log("Deep link received:", event.url);
      
      // Parse the URL to extract access token or code
      const url = new URL(event.url);
      const hashParams = new URLSearchParams(url.hash.substring(1));
      const queryParams = new URLSearchParams(url.search);
      
      const accessToken = hashParams.get('access_token');
      const code = queryParams.get('code');
      const error = hashParams.get('error') || queryParams.get('error');
      
      if (accessToken) {
        console.log("Access token received:", accessToken);
        setToken(accessToken);
        setLoading(false);
        router.replace('/Home');
      } else if (code) {
        console.log("Authorization code received:", code);
        // You would need to exchange this code for a token via a backend
        setLoading(false);
        alert("Authorization code received. Backend token exchange needed.");
      } else if (error) {
        console.error("Auth error:", error);
        setLoading(false);
        alert(`Authentication failed: ${error}`);
      }
    };

    // Add event listener for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);
    
    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      console.log("Starting Spotify authentication...");
      
      const authUrl = buildAuthUrl(); // Try with token first
      
      // Open in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        REDIRECT_URI
      );
      
      console.log("WebBrowser result:", result);
      
      if (result.type === 'cancel') {
        setLoading(false);
        console.log("User cancelled authentication");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setLoading(false);
      alert("Authentication failed. Please try again.");
    }
  };

  return (
    <ImageBackground
      source={require("../assets/background.jpg")}
      style={styles.background}
      blurRadius={6}
    >
      <View style={styles.overlay}>
        <Text style={styles.logoText}>Feelify</Text>
        
        <Text style={styles.statusText}>
          {token ? "✅ Connected!" : loading ? "🔄 Opening Spotify..." : "Not connected"}
        </Text>
        
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
  buttonWrapper: { 
    width: "80%", 
    borderRadius: 50, 
    overflow: "hidden" 
  },
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
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: { 
    width: 26, 
    height: 26, 
    marginRight: 12, 
    tintColor: "#fff" 
  },
  loginText: { 
    color: "#fff", 
    fontSize: 17, 
    fontWeight: "700", 
    letterSpacing: 0.5 
  },
});