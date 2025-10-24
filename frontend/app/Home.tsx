// app/Home.tsx
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from "react-native";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useUser } from "../context/userContext";
import { router } from "expo-router";
export default function Home() {
const { user } = useUser();
  return (
    <View style={styles.container}>
      {/* Header */}
     <View style={styles.header}>
        <Text style={styles.greeting}>
          {`${new Date().getHours() < 12
              ? "Good Morning"
              : new Date().getHours() < 18
              ? "Good Afternoon"
              : "Good Evening"
            }, ${user ? user.display_name.split(" ")[0] : "Guest"}`}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Public Playlists Section */}
        <Text style={styles.sectionTitle}>Public Playlists</Text>
        <View style={styles.playlistGrid}>
          {[
            { id: 1, title: "Top Hits PH", creator: "Feelify" },
            { id: 2, title: "Chill Vibes", creator: "Luna" },
            { id: 3, title: "Daily Mix", creator: "Spotify" },
            { id: 4, title: "Good Energy", creator: "Alex" },
            { id: 5, title: "Midnight Drive", creator: "Mia" },
            { id: 6, title: "Lo-Fi Focus", creator: "Jay" },
          ].map((item) => (
            <View key={item.id} style={styles.playlistItem}>
              <TouchableOpacity>
                <Image
                  source={require("../assets/template_music_icon.jpg")}
                  style={styles.playlistImage}
                />
              </TouchableOpacity>
              <View style={styles.playlistInfo}>
                <Text style={styles.playlistTitle}>{item.title}</Text>
                <Text style={styles.playlistCreator}>by {item.creator}</Text>
              </View>
              {/* Like Button */}
              <TouchableOpacity>
               <Ionicons name="heart-outline" size={20} color="#1DB954" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
          >
          <Octicons name="home" size={32} color="#1DB954" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/CreatePlaylist")}
          >
            <Ionicons name="add-circle-outline" size={33} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push("/Profile")}
          >
            <Ionicons name="person-circle" size={33} color="#fff" />
          </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 50,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  greeting: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 20,
    marginBottom: 15,
  },
  playlistGrid: {
    flexDirection: "column",
    gap: 15,
    paddingHorizontal: 20,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111",
    padding: 10,
    borderRadius: 10,
  },
  playlistImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 10,
  },
  playlistTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  playlistCreator: {
    color: "#aaa",
    fontSize: 12,
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#111",
    paddingVertical: 10,
    borderTopColor: "#1DB95433",
    borderTopWidth: 1,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: {
    alignItems: "center",
  },
  navText: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 3,
  },
  navTextActive: {
    color: "#1DB954",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "bold",
  },
});
