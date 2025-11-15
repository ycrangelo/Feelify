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
  ScrollView 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import { useUser } from "../context/userContext";
import { PINATA_API_KEY, PINATA_SECRET_API_KEY, API_BASE_URL } from '@env';

const CLIENT_ID = "d5fe7c7c327b47639da33e95a1c464e1";
const SCOPES = "user-read-email user-read-private playlist-modify-public playlist-modify-private";
const REDIRECT_URI = "exp://192.168.18.49:8081/--/redirect";
const BACKEND_URL = "https://feelifybackend.onrender.com/";

const GENRES = [
  "Pop",
  "Rock",
  "Hip-Hop",
  "Jazz",
  "Classical",
  "EDM",
  "R&B",
  "Country",
  "K-Pop",
  "OPM",
  "J-Pop",
  "Running",
  "Gym",
  "Chill",
  "Party",
  "Lo-fi",
];

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
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendLoading, setBackendLoading] = useState(true);
  const [genreSelection, setGenreSelection] = useState<string[]>([]);
  const [showGenreSelection, setShowGenreSelection] = useState(false);
  const router = useRouter();
  const { user, setUser } = useUser();

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
      const response = await fetch(`${BACKEND_URL}api/v1/auth/spotify/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();

      if (data.access_token) {
        setToken(data.access_token);
        
        const profileResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const profileData = await profileResponse.json();

        const userObj = {
          display_name: profileData.display_name,
          spotify_id: profileData.id,
          token: data.access_token,
          country: profileData.country,
          genres: [],
        };

        // ⚡ Check if user exists in database
        try {
          const userCheckResponse = await fetch(
            `${BACKEND_URL}api/v1/user/getBy/${profileData.id}`
          );
          const userCheckData = await userCheckResponse.json();

          if (userCheckData.data) {
            // User exists - use their existing genres
            userObj.genres = userCheckData.data.genres || [];
            setUser(userObj);
            
            if (userObj.genres.length === 0) {
              // User exists but has no genres - show genre selection
              setShowGenreSelection(true);
            } else {
              // User exists and has genres - go to home
              router.replace("/Home");
            }
          } else {
            // User doesn't exist - create new user
            const createUserResponse = await fetch(`${BACKEND_URL}api/v1/user/post`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                display_name: profileData.display_name,
                spotify_id: profileData.id,
                country: profileData.country,
                genres: [] // Start with empty genres
              }),
            });

            const newUserData = await createUserResponse.json();
            
            if (newUserData.data) {
              userObj.genres = newUserData.data.genres || [];
              setUser(userObj);
              // Show genre selection for new user
              setShowGenreSelection(true);
            } else {
              throw new Error("Failed to create user");
            }
          }
        } catch (dbError) {
          console.error("Database operation error:", dbError);
          Alert.alert("Error", "Failed to check/create user in database");
        }

      } else {
        Alert.alert("Failed to exchange token", JSON.stringify(data));
      }
    } catch (err) {
      console.error("Error exchanging code for token:", err);
      Alert.alert("Error", "Token exchange failed. Check your backend.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const authUrl = buildAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);

      if (result.type === "cancel") {
        setLoading(false);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      Alert.alert("Authentication failed", "Please try again.");
      setLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setGenreSelection((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const saveGenres = async () => {
    if (!user || genreSelection.length === 0) {
      Alert.alert("Please select at least one genre");
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}api/v1/user/updateGenres/${user.spotify_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ genres: genreSelection }),
        }
      );

      if (!response.ok) throw new Error("Failed to save genres");

      const updatedUser = { ...user, genres: genreSelection };
      setUser(updatedUser);
      setShowGenreSelection(false);
      router.replace("/Home");
    } catch (err) {
      console.error("Error saving genres:", err);
      Alert.alert("Failed to save genres");
    }
  };

  // 🔹 Full-screen green-themed loading screen
  if (backendLoading) {
    return (
      <ImageBackground source={require("../assets/background.jpg")} style={styles.background} blurRadius={6}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1DB954" />
          <Text style={styles.loadingText}>Starting the application...</Text>
          <Text style={[styles.loadingText, { marginTop: 12, fontSize: 16, opacity: 0.8 }]}>
            Thank you for waiting!
          </Text>
        </View>
      </ImageBackground>
    );
  }

  // ⚡ Show genre selection if user needs to select genres
  if (showGenreSelection) {
    return (
      <ImageBackground source={require("../assets/background.jpg")} style={styles.background} blurRadius={6}>
        <View style={styles.genreOverlay}>
          <Text style={styles.genreTitle}>Select Your Favorite Genres</Text>
          <Text style={styles.genreSubtitle}>
            Choose at least one genre to personalize your experience
          </Text>
          
          <ScrollView 
            contentContainerStyle={styles.genreContainer}
            showsVerticalScrollIndicator={false}
          >
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                onPress={() => toggleGenre(genre)}
                style={[
                  styles.genreChip,
                  genreSelection.includes(genre) && styles.genreChipSelected,
                ]}
              >
                <Text style={[
                  styles.genreText,
                  genreSelection.includes(genre) && styles.genreTextSelected
                ]}>
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.genreButtonContainer}>
            <Text style={styles.selectedCount}>
              {genreSelection.length} genre(s) selected
            </Text>
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                genreSelection.length === 0 && styles.saveButtonDisabled
              ]} 
              onPress={saveGenres}
              disabled={genreSelection.length === 0}
            >
              <Text style={styles.saveButtonText}>
                Save & Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require("../assets/background.jpg")} style={styles.background} blurRadius={6}>
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
  genreOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
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
  // Genre Selection Styles
  genreTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1DB954",
    textAlign: "center",
    marginBottom: 10,
  },
  genreSubtitle: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginBottom: 30,
    opacity: 0.8,
  },
  genreContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    paddingBottom: 20,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "#555",
  },
  genreChipSelected: {
    backgroundColor: "#1DB954",
    borderColor: "#1DB954",
  },
  genreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  genreTextSelected: {
    color: "#000",
    fontWeight: "700",
  },
  genreButtonContainer: {
    marginTop: 20,
    alignItems: "center",
    gap: 15,
  },
  selectedCount: {
    color: "#1DB954",
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
  },
  saveButtonDisabled: {
    backgroundColor: "#555",
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
});