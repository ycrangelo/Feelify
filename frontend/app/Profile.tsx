import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Modal } from "react-native";
import { Ionicons, Octicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useUser } from "../context/userContext";
import { useState, useEffect } from "react";

const BACKEND_URL = "https://feelifybackend.onrender.com";

export default function Profile() {
  const { user, setUser } = useUser();
  const router = useRouter();

  const [userDetails, setUserDetails] = useState<any>(null);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendedSongs, setRecommendedSongs] = useState({});
  const [loadingSongs, setLoadingSongs] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.spotify_id) {
        setLoading(false);
        return;
      }
      try {
        // User details
        const resUser = await fetch(`${BACKEND_URL}/api/v1/user/getBy/${user.spotify_id}`);
        if (resUser.ok) {
          const data = await resUser.json();
          setUserDetails(data.data);
        }

        // User playlists
        const resAlbums = await fetch(`${BACKEND_URL}/api/v1/album/get/${user.spotify_id}`);
        if (resAlbums.ok) {
          const dataAlbums = await resAlbums.json();
          setPlaylists(dataAlbums.data || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [user?.spotify_id]);

  const handleLogout = () => {
    setUser(null);
    setUserDetails(null);
    setPlaylists([]);
    router.replace("/");
  };

  const openModal = (album: any) => {
    setSelectedAlbum(album);
    setModalVisible(true);
    fetchRecommendedSongs(album);
  };

  const fetchRecommendedSongs = async (album: any) => {
    if (!album?.albumId) return;
    setLoadingSongs(true);
    try {
      const match = album.albumId.match(/playlist\/([a-zA-Z0-9]+)/);
      const playlistId = match ? match[1] : null;
      if (!playlistId) return;

      const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      const tracks = data.items?.map((item: any) => ({
        title: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(", "),
      })) || [];
      setRecommendedSongs((prev) => ({ ...prev, [album.id]: tracks }));
    } catch (error) {
      console.error(error);
      setRecommendedSongs((prev) => ({ ...prev, [album.id]: [] }));
    } finally {
      setLoadingSongs(false);
    }
  };

  const renderEmotions = (emotionsObj = {}) => {
    const emotionsArray = Object.entries(emotionsObj).map(([name, value]: any) => ({
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

  const renderRecommendedSongs = (album: any) => {
    if (!album) return null;
    const songs = recommendedSongs[album.id] || [];
    if (loadingSongs && !songs.length) return <Text style={{ color: "#aaa" }}>Loading...</Text>;
    if (!songs.length) return <Text style={{ color: "#aaa" }}>No songs found</Text>;
    return songs.map((s: any, idx: number) => (
      <Text key={idx} style={styles.recoText}>• {s.title} by {s.artist}</Text>
    ));
  };

  const getSpotifyUrl = (album: any) => album?.albumId?.startsWith("https://") ? album.albumId : null;

  const displayUser = userDetails || user;
  const genres = userDetails?.genres || user?.genres || [];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <View style={styles.centerContent}>
          <Image source={{ uri: displayUser?.avatar || "https://cdn-icons-png.flaticon.com/512/1077/1077012.png" }} style={styles.avatar} />
          <Text style={styles.name}>{displayUser?.display_name || "Spotify User"}</Text>

          {/* Genres */}
          <View style={styles.genresContainer}>
            {genres.slice(0, 6).map((genre: string, index: number) => (
              <View key={index} style={styles.genreCard}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>

          {/* Playlists */}
          <Text style={styles.sectionTitle}>Your Playlists</Text>
          {loading ? (
            <Text style={{ color: "#aaa", marginTop: 20 }}>Loading...</Text>
          ) : playlists.length === 0 ? (
            <Text style={{ color: "#aaa", marginTop: 20 }}>No playlists found</Text>
          ) : (
            <View style={styles.playlistGrid}>
              {playlists.map((album) => (
                <TouchableOpacity key={album.id} style={styles.playlistItem} onPress={() => openModal(album)}>
                  <Image source={{ uri: album.picUrl || "https://cdn-icons-png.flaticon.com/512/727/727245.png" }} style={styles.playlistImage} />
                  <View style={styles.playlistInfo}>
                    <Text style={styles.playlistTitle}>{album.albumName || "Untitled"}</Text>
                    <Text style={styles.playlistCreator}>by {album.createdBy || "Unknown"}</Text>
                  </View>
                  {/* Likes count on the right side */}
                  <View style={styles.likesContainer}>
                    <Ionicons name="heart" size={16} color="#ff1a1a" />
                    <Text style={styles.likesCount}>{album.likes || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#000" />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Playlist Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedAlbum?.albumName}</Text>
                {/* Likes in modal */}
                {selectedAlbum && (
                  <View style={styles.modalLikesContainer}>
                    <Ionicons name="heart" size={20} color="#ff1a1a" />
                    <Text style={styles.modalLikesCount}>{selectedAlbum.likes || 0}</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: "#aaa", marginBottom: 10 }}>by {selectedAlbum?.createdBy}</Text>

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

              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/Home")}>
          <Octicons name="home" size={32} color="#1DB954" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/CreatePlaylist")}>
          <Ionicons name="add-circle-outline" size={33} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-circle" size={33} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  centerContent: { width: "100%", alignItems: "center", padding: 20, paddingBottom: 120, marginTop:"15%" },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 15 },
  name: { color: "#fff", fontSize: 26, fontWeight: "700", marginBottom: 15 },
  genresContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginBottom: 20 },
  genreCard: { backgroundColor: "#1DB954", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  genreText: { color: "#000", fontWeight: "600", fontSize: 14 },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "700", marginVertical: 10 },
  playlistGrid: { flexDirection: "column", gap: 15, width: "100%" },
  playlistItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#111", 
    padding: 10, 
    borderRadius: 10,
    justifyContent: "space-between" 
  },
  playlistImage: { width: 60, height: 60, borderRadius: 8, marginRight: 10 },
  playlistInfo: { flex: 1 },
  playlistTitle: { color: "#fff", fontSize: 16, fontWeight: "600" },
  playlistCreator: { color: "#aaa", fontSize: 12 },
  likesContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4,
    marginLeft: 10
  },
  likesCount: { color: "#fff", fontSize: 14, fontWeight: "600" },
  logoutButton: { backgroundColor: "#ff1a1aff", paddingVertical: 14, paddingHorizontal: 50, borderRadius: 25, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginTop: "20%" },
  logoutText: { color: "#000", fontWeight: "700", fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: "#000B", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#111", padding: 20, borderRadius: 12, width: "90%", maxHeight: "85%" },
  modalHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 5
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", flex: 1 },
  modalLikesContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 5 
  },
  modalLikesCount: { color: "#fff", fontSize: 16, fontWeight: "600" },
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
  bottomNav: { flexDirection: "row", justifyContent: "space-around", backgroundColor: "#111", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1DB95433", position: "absolute", bottom: 0, width: "100%" },
  navItem: { alignItems: "center" },
});