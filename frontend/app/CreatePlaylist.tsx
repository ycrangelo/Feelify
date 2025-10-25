import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView } from "react-native";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CreatePlaylist() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>🪄 Create New Playlist</Text>
        <Text style={styles.subHeader}>Fill out the details below</Text>

        <TextInput placeholder="Playlist name" placeholderTextColor="#777" style={styles.input} />
        <TextInput placeholder="Description" placeholderTextColor="#777" style={styles.input} />

        <TouchableOpacity style={styles.createButton}>
          <Text style={styles.createText}>Create Playlist</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Bottom Navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push("/Home")} style={styles.navItem}>
         <Octicons name="home"  color="#fff" size={32} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <Ionicons color="#1DB954"  name="add-circle-outline" size={33} />
         
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/Profile")} style={styles.navItem}>
          <Ionicons color="#fff" name="person-circle" size={33}  />
         
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#000", // ✅ prevent white flash
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
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
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,  // ✅ ensures full stretch
    right: 0, // ✅ ensures full stretch
  },
  navItem: { alignItems: "center" },
  navText: { color: "#fff", fontSize: 12, marginTop: 2 },
});
