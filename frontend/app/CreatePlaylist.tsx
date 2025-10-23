import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CreatePlaylist() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🪄 Create New Playlist</Text>
      <Text style={styles.subHeader}>Fill out the details below</Text>

      <TextInput placeholder="Playlist name" placeholderTextColor="#777" style={styles.input} />
      <TextInput placeholder="Description" placeholderTextColor="#777" style={styles.input} />

      <TouchableOpacity style={styles.createButton}>
        <Text style={styles.createText}>Create Playlist</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.replace("/Home")} style={styles.navItem}>
          <Ionicons name="home-outline" size={26} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/CreatePlaylist")} style={styles.navItem}>
          <Ionicons name="add-circle" size={26} color="#1DB954" />
          <Text style={[styles.navText, { color: "#1DB954" }]}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/Profile")} style={styles.navItem}>
          <Ionicons name="person-circle-outline" size={26} color="#fff" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 60, paddingHorizontal: 20 },
  header: { color: "#1DB954", fontSize: 26, fontWeight: "bold" },
  subHeader: { color: "#bbb", fontSize: 16, marginBottom: 30 },
  input: {
    backgroundColor: "#121212",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  createButton: {
    backgroundColor: "#1DB954",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },
  createText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#111",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: { alignItems: "center" },
  navText: { color: "#fff", fontSize: 12, marginTop: 2 },
});
