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
  Modal,
} from "react-native";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useUser } from "../context/userContext";
import { router } from "expo-router";

export default function Home() {
  const { user } = useUser();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedAlbums, setLikedAlbums] = useState({});
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendedSongs, setRecommendedSongs] = useState({}); // album.id => songs array
  const [loadingSongs, setLoadingSongs] = useState(false);

  // Fetch public playlists
  const fetchPublicAlbums = async () => {
    try {
      const res = await fetch("https://feelifybackend.onrender.com/api/v1/album/get");
      const data = await res.json();

      // Preserve likes for already liked albums
      const updatedAlbums = (data.data || []).map((album) => ({
        ...album,
        likes: likedAlbums[album.id] ? album.likes : album.likes ?? 0,
      }));

      setAlbums(updatedAlbums);
    } catch (error) {
      console.error("Error fetching albums:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + interval for every 6 seconds
  useEffect(() => {
    fetchPublicAlbums();
    const interval = setInterval(fetchPublicAlbums, 10000);
    return () => clearInterval(interval);
  }, []);

  // Like handler
  const handleLike = async (album) => {
    try {
      if (likedAlbums[album.id]) return;

      setAlbums((prev) =>
        prev.map((a) =>
          a.id === album.id ? { ...a, likes: (a.likes ?? 0) + 1 } : a
        )
      );

      setLikedAlbums((prev) => ({ ...prev, [album.id]: true }));

      const res = await fetch(
        "https://feelifybackend.onrender.com/api/v1/album/post/like",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: album.id }),
        }
      );

      if (!res.ok) {
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

  // Fetch Spotify playlist tracks
  const fetchSpotifyTracks = async (spotifyUrl, albumId) => {
    try {
      if (!spotifyUrl) return;
      setLoadingSongs(true);

      const match = spotifyUrl.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = match ? match[1] : null;
      if (!playlistId) return;

      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      const data = await res.json();
      const tracks =
        data.items?.map((item) => ({
          title: item.track.name,
          artist: item.track.artists.map((a) => a.name).join(", "),
        })) || [];

      setRecommendedSongs((prev) => ({ ...prev, [albumId]: tracks }));
    } catch (error) {
      console.error("Error fetching Spotify tracks:", error);
      setRecommendedSongs((prev) => ({ ...prev, [albumId]: [] }));
    } finally {
      setLoadingSongs(false);
    }
  };

  // Open modal
  const openModal = (album) => {
    setSelectedAlbum(album);
    setModalVisible(true);

    const spotifyUrl = getSpotifyUrl(album);
    if (spotifyUrl) fetchSpotifyTracks(spotifyUrl, album.id);
  };

  // Render emotions
  const renderEmotions = (emotionsObj = {}) => {
    const emotionsArray = Object.entries(emotionsObj).map(([name, value]) => ({
      name,
      percentage: Math.round(value * 100),
    }));

    return emotionsArray.map((e, idx) => (
      <View key={idx} style={styles.emotionRow}>
        <Text style={styles.emotionText}>{e.name}</Text>
        <View style={styles.emotionBarBackground}>
          <View style={[styles.emotionBar, { width: `${e.percentage}%` }]} />
        </View>
        <Text style={styles.emotionPercent}>{e.percentage}%</Text>
      </View>
    ));
  };

  // Render recommended songs
  const renderRecommendedSongs = (album) => {
    if (!album) return null;

    const songs = recommendedSongs[album.id] || [];
    if (loadingSongs && !songs.length)
      return <Text style={{ color: "#aaa" }}>Loading...</Text>;
    if (!songs.length)
      return <Text style={{ color: "#aaa" }}>No songs found</Text>;

    return songs.map((s, idx) => (
      <Text key={idx} style={styles.recoText}>
        • {s.title} by {s.artist}
      </Text>
    ));
  };

  const getSpotifyUrl = (album) => {
    return album?.albumId?.startsWith("https://") ? album.albumId : null;
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
        <Text style={styles.sectionTitle}>Public Playlists</Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#1DB954"
            style={{ marginTop: 20 }}
          />
        ) : (
        <View style={styles.playlistGrid}>
          {albums.length > 0 ? (
            albums.map((album) => (
              <TouchableOpacity
                key={album.id}
                style={styles.playlistItem}
                onPress={() => openModal(album)}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri:
                      album.picUrl ||
                      "https://via.placeholder.com/150?text=No+Image",
                  }}
                  style={styles.playlistImage}
                />

                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>
                    {album.albumName || "Untitled"}
                  </Text>
                  <Text style={styles.playlistCreator}>
                    by {album.createdBy || "Unknown"}
                  </Text>
                </View>

                <View style={styles.likeContainer}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation(); // prevent modal opening when liking
                      handleLike(album);
                    }}
                  >
                    <Ionicons
                      name={likedAlbums[album.id] ? "heart" : "heart-outline"}
                      size={20}
                      color="#1DB954"
                    />
                  </TouchableOpacity>
                  <Text style={styles.likeCount}>{album.likes ?? 0}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text
              style={{ color: "#aaa", textAlign: "center", marginTop: 20 }}
            >
              No playlists found.
            </Text>
          )}
        </View>
        )}
      </ScrollView>

{/* Modal */}
<Modal visible={modalVisible} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
      >
        <Text style={styles.modalTitle}>{selectedAlbum?.albumName}</Text>
        <Text style={{ color: "#aaa", marginBottom: 10 }}>
          by {selectedAlbum?.createdBy}
        </Text>

        <Text style={styles.sectionHeader}>Emotions</Text>
        {renderEmotions(selectedAlbum?.emotions)}

        <Text style={styles.sectionHeader}>Recommended Songs</Text>
        {selectedAlbum && renderRecommendedSongs(selectedAlbum)}

        <TouchableOpacity
          style={styles.spotifyButton}
          onPress={() => {
            const url = getSpotifyUrl(selectedAlbum);
            if (url) router.push(url);
            else Alert.alert("No Spotify URL available");
          }}
        >
          <Text style={styles.spotifyButtonText}>Open in Spotify</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setModalVisible(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  </View>
</Modal>

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
  container: { flex: 1, backgroundColor: "#000", paddingTop: 50 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 20 },
  greeting: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  scrollContent: { paddingBottom: 100 },
  sectionTitle: { color: "#fff", fontSize: 18, fontWeight: "600", marginLeft: 20, marginBottom: 15 },
  playlistGrid: { flexDirection: "column", gap: 15, paddingHorizontal: 20 },
  playlistItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#111", padding: 10, borderRadius: 10 },
  playlistImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  playlistInfo: { flex: 1, marginLeft: 10 },
  playlistTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  playlistCreator: { color: "#aaa", fontSize: 12 },
  likeContainer: { flexDirection: "row", alignItems: "center", gap: 5 },
  likeCount: { color: "#1DB954", fontSize: 14 },
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#111", paddingVertical: 10, borderTopColor: "#1DB95433", borderTopWidth: 1, position: "absolute", bottom: 0, width: "100%" },
  navItem: { alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "#000B", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#111", padding: 20, borderRadius: 12, width: "90%",  maxHeight: "85%" },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 5 },
  sectionHeader: { color: "#fff", fontWeight: "bold", marginTop: 10, marginBottom: 5 },
  emotionRow: { flexDirection: "row", alignItems: "center", marginVertical: 4 },
  emotionText: { color: "#fff", width: 70 },
  emotionBarBackground: { flex: 1, height: 10, backgroundColor: "#333", borderRadius: 5, marginHorizontal: 5 },
  emotionBar: { height: 10, backgroundColor: "#1DB954", borderRadius: 5 },
  emotionPercent: { color: "#fff", width: 40, textAlign: "right" },
  recoText: { color: "#fff", marginVertical: 2 },
  spotifyButton: { backgroundColor: "#1DB954", padding: 10, borderRadius: 8, marginTop: 15, alignItems: "center" },
  spotifyButtonText: { color: "#000", fontWeight: "bold" },
  closeButton: { backgroundColor: "#555", padding: 10, borderRadius: 8, marginTop: 10, alignItems: "center" },
  closeButtonText: { color: "#fff", fontWeight: "bold" },
});
