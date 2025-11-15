import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ImageBackground, Alert } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "../context/userContext";

const GENRES = [
  "Pop", "Rock", "Hip-Hop", "Jazz", "Classical", "EDM", "R&B",
  "Country", "K-Pop", "OPM", "J-Pop", "Running", "Gym", "Chill",
  "Party", "Lo-fi",
];

const BACKEND_URL = "https://feelifybackend.onrender.com";

export default function Genres() {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const { user, setUser } = useUser();
  const router = useRouter();

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

const createUser = async () => {
  if (!user) return Alert.alert("Error", "User info not found");
  if (selectedGenres.length === 0) return Alert.alert("Select at least one genre");

  try {
    // Send genres to backend
    const response = await fetch(`${BACKEND_URL}/api/v1/user/post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        display_name: user.display_name,
        spotify_id: user.spotify_id,
        country: user.country,
        genres: selectedGenres,
      }),
    });

    if (!response.ok) throw new Error("Failed to create user");

    // Update context with genres
    const updatedUser = { ...user, genres: selectedGenres };
    setUser(updatedUser);

    // Go to Home
    router.replace("/Home");
  } catch (err) {
    console.error(err);
    Alert.alert("Failed to create user");
  }
};


  return (
    <ImageBackground
      source={require("../assets/background.jpg")}
      style={styles.background}
      blurRadius={6}
    >
      <View style={styles.overlay}>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Select Your Favorite Genres</Text>
          <Text style={styles.subtitle}>Choose at least one genre</Text>

          <ScrollView 
            contentContainerStyle={styles.chipContainer} 
            showsVerticalScrollIndicator={false}
          >
            {GENRES.map((genre) => (
              <TouchableOpacity
                key={genre}
                style={[
                  styles.chip,
                  selectedGenres.includes(genre) && styles.chipSelected,
                ]}
                onPress={() => toggleGenre(genre)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedGenres.includes(genre) && styles.chipTextSelected,
                  ]}
                >
                  {genre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.button, selectedGenres.length === 0 && styles.buttonDisabled]}
            onPress={createUser}
            disabled={selectedGenres.length === 0}
          >
            <Text style={styles.buttonText}>Create User</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    width: "100%",
    alignItems: "center",
  },
  title: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#1DB954", 
    marginBottom: 10, 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#fff", 
    marginBottom: 20, 
    opacity: 0.8, 
    textAlign: "center" 
  },
  chipContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "center", 
    gap: 8,
    marginBottom: 20,
  },
  chip: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 20, 
    backgroundColor: "#333", 
    borderWidth: 1, 
    borderColor: "#555", 
    margin: 6 
  },
  chipSelected: { 
    backgroundColor: "#1DB954", 
    borderColor: "#1DB954" 
  },
  chipText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  chipTextSelected: { 
    color: "#000", 
    fontWeight: "700" 
  },
  button: { 
    backgroundColor: "#1DB954", 
    paddingVertical: 16, 
    paddingHorizontal: 40, 
    borderRadius: 25, 
    marginTop: 20 
  },
  buttonDisabled: { 
    backgroundColor: "#555", 
    opacity: 0.6 
  },
  buttonText: { 
    color: "#000", 
    fontWeight: "bold", 
    fontSize: 16 
  },
});
