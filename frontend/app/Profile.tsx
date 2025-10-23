import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../context/userContext";

export default function Profile() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/1077/1077012.png" }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{user?.display_name || "Spotify User"}</Text>
      <Text style={styles.country}>{user?.country || "Unknown Country"}</Text>

      <TouchableOpacity style={styles.logoutButton}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.replace("/Home")} style={styles.navItem}>
          <Ionicons name="home-outline" size={26} color="#fff" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/CreatePlaylist")} style={styles.navItem}>
          <Ionicons name="add-circle-outline" size={26} color="#fff" />
          <Text style={styles.navText}>Create</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/Profile")} style={styles.navItem}>
          <Ionicons name="person-circle" size={26} color="#1DB954" />
          <Text style={[styles.navText, { color: "#1DB954" }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  name: { color: "#1DB954", fontSize: 22, fontWeight: "bold" },
  country: { color: "#bbb", fontSize: 14, marginBottom: 40 },
  logoutButton: {
    backgroundColor: "#1DB954",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
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
