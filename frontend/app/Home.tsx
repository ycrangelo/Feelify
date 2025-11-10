// app/Home.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useUser } from "../context/userContext";
import { router } from "expo-router";

export default function Home() {
  const { user } = useUser();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedAlbums, setLikedAlbums] = useState({}); // track liked albums

  // Fetch albums on load
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch("https://feelifybackend.onrender.com/api/v1/album/get");
        const data = await res.json();
        setAlbums(data.data || []);
      } catch (error) {
        console.error("Error fetching albums:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, []);

// Like handler
const handleLike = async (album) => {
  try {
    // Prevent multiple likes
    if (likedAlbums[album.id]) return;

    // Optimistic UI update
    setAlbums((prev) =>
      prev.map((a) =>
        a.id === album.id ? { ...a, likes: (a.likes ?? 0) + 1 } : a
      )
    );

    // Mark album as liked locally
    setLikedAlbums((prev) => ({ ...prev, [album.id]: true }));

    // Send the internal id to backend
    const res = await fetch(
      "https://feelifybackend.onrender.com/api/v1/album/post/like",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: album.id }), // ✅ changed from albumId to id
      }
    );

    if (!res.ok) {
      // Rollback optimistic update if failed
      setAlbums((prev) =>
        prev.map((a) =>
          a.id === album.id ? { ...a, likes: (a.likes ?? 0) - 1 } : a
        )
      );
      setLikedAlbums((prev) => {
        const copy = { ...prev };
        delete copy[album.id];
        return copy;
      });
      throw new Error("Failed to like album");
    }
  } catch (error) {
    console.error("Error liking album:", error);
    Alert.alert("Error", "Failed to like album.");
  }
};

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Public Playlists Section */}
        <Text style={styles.sectionTitle}>Public Playlists</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#1DB954" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.playlistGrid}>
            {albums.length > 0 ? (
              albums.map((album) => (
                <View key={album.id} style={styles.playlistItem}>
                  <TouchableOpacity>
                    <Image
                      source={{
                        uri:
                          album.picUrl ||
                          "https://via.placeholder.com/150?text=No+Image",
                      }}
                      style={styles.playlistImage}
                    />
                  </TouchableOpacity>

                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistTitle}>
                      {album.albumName || "Untitled"}
                    </Text>
                    <Text style={styles.playlistCreator}>
                      by {album.createdBy || "Unknown"}
                    </Text>
                  </View>

                  {/* Like Button with count beside it */}
                  <View style={styles.likeContainer}>
                    <TouchableOpacity onPress={() => handleLike(album)}>
                      <Ionicons
                        name={likedAlbums[album.id] ? "heart" : "heart-outline"} // ✅ changed from album.albumId
                        size={20}
                        color="#1DB954"
                      />
                    </TouchableOpacity>
                    <Text style={styles.likeCount}>{album.likes ?? 0}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: "#aaa", textAlign: "center", marginTop: 20 }}>
                No playlists found.
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
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
  likeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  likeCount: {
    color: "#1DB954",
    fontSize: 14,
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
});
