import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Octicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  PINATA_JWT,
  GATEWAY_URL,
  PINATA_API_KEY,
  PINATA_SECRET_API_KEY,
} from "@env";
import { useUser } from "../context/userContext";

export default function CreatePlaylist() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [playlistCover, setPlaylistCover] = useState<string | null>(null);
  const [playlistName, setPlaylistName] = useState("");
  const [loading, setLoading] = useState(false);
  const [usingJWT, setUsingJWT] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [emotionData, setEmotionData] = useState<any>(null);
  const [songSuggestions, setSongSuggestions] = useState<any[]>([]);
  const { user, setUser } = useUser();
  // 🎥 Open Camera
  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is required!");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 🖼️ Pick Image from Gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // 🖼️ Pick Playlist Cover Image
  const pickPlaylistCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPlaylistCover(result.assets[0].uri);
  };

  // 🧠 Check credentials
  const checkCredentials = () => {
    const hasJWT = !!PINATA_JWT && PINATA_JWT.startsWith("eyJ");
    const hasAPIKeys =
      !!PINATA_API_KEY && !!PINATA_SECRET_API_KEY && PINATA_API_KEY.length > 10;
    return { hasJWT, hasAPIKeys };
  };

const savePlaylistToBackend = async () => {
  if (!playlistCover || !playlistName) throw new Error("Playlist cover and name are required.");

  setLoading(true);

  try {
    // 1️⃣ Upload playlist cover to Pinata
    const { hasJWT, hasAPIKeys } = checkCredentials();

    const filename = playlistCover.split("/").pop() || "cover.jpg";
    const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";

    const formData = new FormData();
    formData.append("file", {
      uri: playlistCover,
      name: filename,
      type,
    } as any);

    let headers: any = {};
    if (hasJWT && usingJWT) {
      headers = { Authorization: `Bearer ${PINATA_JWT}` };
    } else if (hasAPIKeys) {
      headers = {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      };
    }

    const uploadRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await uploadRes.json();
    if (!data.IpfsHash) throw new Error("Failed to upload cover image to Pinata");

    const picUrl = `https://${GATEWAY_URL}/ipfs/${data.IpfsHash}`;

    // 2️⃣ Process emotions
    const sortedEmotions = Object.entries(emotionData || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
    const dominantEmotion = sortedEmotions[0]?.[0] || "neutral";
    const topEmotions = Object.fromEntries(sortedEmotions.slice(0, 5)); // top 5 or 3 if you want

    // 3️⃣ Prepare payload
    const albumPayload = {
      dominantEmotion,
      albumName: playlistName,
      picUrl,
      userId: user?.id, 
      createdBy: user?.display_name, 
      albumId: "test test",
      emotions: topEmotions,
    };

    // 4️⃣ POST to backend
    const res = await fetch("https://feelifybackend.onrender.com/api/v1/album/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(albumPayload),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save playlist");
    }

    return await res.json();
  } finally {
    setLoading(false);
  }
};



  // 🚀 Upload to Pinata + Analyze
  const uploadToPinata = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or capture an image first!");
      return;
    }

    const { hasJWT, hasAPIKeys } = checkCredentials();

    try {
      setLoading(true);
      const filename = image.split("/").pop() || "photo.jpg";
      const type = filename.endsWith(".png") ? "image/png" : "image/jpeg";

      const formData = new FormData();
      formData.append("file", {
        uri: image,
        name: filename,
        type,
      } as any);

      let headers: any = {};
      let method = "";

      if (hasJWT && usingJWT) {
        headers = { Authorization: `Bearer ${PINATA_JWT}` };
        method = "JWT";
      } else if (hasAPIKeys) {
        headers = {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        };
        method = "API Keys";
      }

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (data?.IpfsHash) {
        const imgUrl = `https://${GATEWAY_URL}/ipfs/${data.IpfsHash}`;

        const backendRes = await fetch(
          "https://feelifybackend.onrender.com/api/v1/model/prompt",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: imgUrl }),
          }
        );

        const backendData = await backendRes.json();

        let emotion = null;
        let songs: any[] = [];
        if (Array.isArray(backendData)) {
          emotion = backendData.find((i) => i.type === "emotion_analysis")?.data || null;
          songs = backendData.find((i) => i.type === "song_suggestions")?.data || [];
        } else {
          emotion = backendData.emotion_analysis?.data || null;
          songs = backendData.song_suggestions?.data || [];
        }

        setEmotionData(emotion);
        setSongSuggestions(songs);
        setModalVisible(true);
      } else {
        Alert.alert("Upload failed", "No IPFS hash returned.");
      }
    } catch (error: any) {
      Alert.alert("Upload failed", error.message || "Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Create New Playlist</Text>

        <View style={styles.imageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.placeholderBox}>
              <Ionicons name="image-outline" size={60} color="#444" />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        <View style={styles.fileButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={openCamera}>
            <Ionicons name="camera" size={24} color="#1DB954" />
            <Text style={styles.iconText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <Ionicons name="image" size={24} color="#1DB954" />
            <Text style={styles.iconText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && { opacity: 0.7 }]}
          onPress={uploadToPinata}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createText}>Analyze Image</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* 🎭 Enhanced Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 20 }}
              indicatorStyle="white" // ✅ visible white scrollbar
              showsVerticalScrollIndicator={true}
            >
              {/* 🖼️ Playlist Cover */}
              <TouchableOpacity style={styles.coverContainer} onPress={pickPlaylistCover}>
                {playlistCover ? (
                  <Image source={{ uri: playlistCover }} style={styles.coverImage} />
                ) : (
                  <View style={styles.coverPlaceholder}>
                    <Ionicons name="image-outline" size={50} color="#555" />
                    <Text style={styles.coverText}>Add Playlist Cover</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* 📝 Playlist Name */}
              <Text style={styles.inputLabel}>Playlist Name</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter playlist name"
                  placeholderTextColor="#777"
                  value={playlistName}
                  onChangeText={setPlaylistName}
                />
              </View>

              {/* 🎭 Top 3 Emotions */}
              <Text style={[styles.modalTitle, { marginTop: 15 }]}>🎭 Top 3 Emotions</Text>
              {emotionData ? (
                Object.entries(emotionData)
                  .sort((a, b) => Number(b[1]) - Number(a[1]))
                  .slice(0, 3)
                  .map(([key, value]) => (
                    <Text key={key} style={styles.modalText}>
                      {key}: {(Number(value) * 100).toFixed(1)}%
                    </Text>
                  ))
              ) : (
                <Text style={styles.modalText}>No emotion data found.</Text>
              )}

              {/* 🎵 Song Suggestions */}
              <Text style={[styles.modalTitle, { marginTop: 20 }]}>🎶 Song Suggestions</Text>
              {songSuggestions.length > 0 ? (
                songSuggestions.map((song, i) => {
                  const title = song?.title || song?.name || "Untitled";
                  const artist = song?.artist || song?.singer || "Unknown Artist";
                  return (
                    <Text key={i} style={styles.modalText}>
                      {i + 1}. {title} — {artist}
                    </Text>
                  );
                })
              ) : (
                <Text style={styles.modalText}>No song suggestions available.</Text>
              )}

              {/* 💾 Save + Close */}
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!playlistName || !playlistCover || loading) && { opacity: 0.5 },
                ]}
                disabled={!playlistName || !playlistCover || loading}
                onPress={async () => {
                  try {
                    const result = await savePlaylistToBackend();
                    Alert.alert("✅ Playlist Created", `"${playlistName}" has been saved successfully!`);
                    setModalVisible(false);
                  } catch (err: any) {
                    Alert.alert("❌ Error", err.message || "Failed to save playlist");
                  }
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Playlist</Text>
                )}
              </TouchableOpacity>


              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🧭 Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.push("/Home")} style={styles.navItem}>
          <Octicons name="home" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="add-circle" size={36} color="#1DB954" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/Profile")} style={styles.navItem}>
          <Ionicons name="person-circle" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  coverContainer: {
    backgroundColor: "#111",
    borderRadius: 12,
    overflow: "hidden",
    height: 180,
    marginBottom: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1DB95433",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  coverText: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
  inputLabel: {
    color: "#1DB954",
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 5,
  },
  inputBox: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#1DB95433",
    marginBottom: 10,
  },
  inputText: {
    color: "#fff",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    textTransform: "uppercase",
  },
  safeContainer: { flex: 1, backgroundColor: "#000" },
  scrollContainer: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 24, paddingBottom: 120 },
  header: {
    color: "#1DB954",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  imageContainer: {
    backgroundColor: "#111",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  placeholderBox: { height: 200, justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#555", fontSize: 14, marginTop: 8 },
  imagePreview: { width: "100%", height: 200 },
  fileButtons: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25 },
  iconButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    paddingVertical: 12,
    justifyContent: "center",
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#1DB95433",
  },
  iconText: { color: "#fff", marginLeft: 10, fontSize: 15, fontWeight: "600" },
  createButton: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 15,
  },
  createText: { color: "#fff", fontWeight: "bold", fontSize: 17, textTransform: "uppercase" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 14,
    width: "100%",
    maxWidth: 380,
    maxHeight: "80%",
  },
  modalTitle: { color: "#1DB954", fontSize: 20, fontWeight: "bold", marginBottom: 8 },
  modalText: { color: "#fff", fontSize: 15, marginBottom: 4 },
  closeButton: {
    backgroundColor: "#1DB954",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 15,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
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
  },
  navItem: { alignItems: "center" },
});
