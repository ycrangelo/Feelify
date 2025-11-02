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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Octicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { PINATA_JWT, GATEWAY_URL, PINATA_API_KEY, PINATA_SECRET_API_KEY } from "@env";

export default function CreatePlaylist() {
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usingJWT, setUsingJWT] = useState(true);

  // 📸 Open Camera
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

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🖼️ Pick from Gallery
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🔍 Check Available Credentials - FIXED VERSION
  const checkCredentials = () => {
    // Better JWT detection - only check if it exists and has proper JWT format
    const hasJWT = !!PINATA_JWT && 
                  PINATA_JWT.length > 50 && // JWT tokens are typically long
                  PINATA_JWT.startsWith('eyJ'); // JWT usually starts with 'eyJ'
    
    // Better API key detection
    const hasAPIKeys = !!PINATA_API_KEY && !!PINATA_SECRET_API_KEY && 
                      PINATA_API_KEY.length > 10 && 
                      PINATA_SECRET_API_KEY.length > 10;
    
    console.log("🔐 Available credentials:", { 
      hasJWT, 
      hasAPIKeys,
      jwtLength: PINATA_JWT?.length,
      jwtStartsWith: PINATA_JWT?.substring(0, 10),
      apiKeyLength: PINATA_API_KEY?.length,
      secretLength: PINATA_SECRET_API_KEY?.length
    });
    
    return { hasJWT, hasAPIKeys };
  };

  // 🚀 Upload to Pinata (with automatic fallback)
  const uploadToPinata = async () => {
    if (!image) {
      Alert.alert("No Image", "Please select or capture an image first!");
      return;
    }

    const { hasJWT, hasAPIKeys } = checkCredentials();
    
    if (!hasJWT && !hasAPIKeys) {
      Alert.alert(
        "Configuration Error", 
        "No valid Pinata credentials found.\n\nPlease check your .env file configuration.",
        [
          {
            text: "Setup Guide",
            onPress: showSetupInstructions
          }
        ]
      );
      return;
    }

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

      let headers = {};
      let method = "";

      // Try JWT first if available, otherwise use API keys
      if (hasJWT && usingJWT) {
        headers = { Authorization: `Bearer ${PINATA_JWT}` };
        method = "JWT";
        console.log("🔐 Using JWT authentication");
        console.log("JWT Token preview:", PINATA_JWT.substring(0, 50) + "...");
      } else if (hasAPIKeys) {
        headers = {
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_API_KEY,
        };
        method = "API Keys";
        console.log("🔑 Using API Key authentication");
      }

      console.log("📤 Uploading to Pinata with:", method);
      
      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: headers,
        body: formData,
      });

      const data = await res.json();
      console.log("📥 Pinata response status:", res.status);
      console.log("📥 Pinata response data:", data);

      if (res.status === 401 || res.status === 403) {
        // Authentication failed - try fallback method
        if (method === "JWT" && hasAPIKeys) {
          console.log("🔄 JWT failed, switching to API Keys...");
          setUsingJWT(false);
          
          // Retry with API keys
          const retryHeaders = {
            pinata_api_key: PINATA_API_KEY,
            pinata_secret_api_key: PINATA_SECRET_API_KEY,
          };
          
          const retryRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: retryHeaders,
            body: formData,
          });
          
          const retryData = await retryRes.json();
          console.log("🔄 Retry response:", retryData);
          
          if (retryData?.IpfsHash) {
            const imgUrl = `https://${GATEWAY_URL}/ipfs/${retryData.IpfsHash}`;
            Alert.alert("✅ Upload Successful", `Image uploaded with API Keys!\n\nIPFS Hash: ${retryData.IpfsHash}`);
            console.log("✅ Uploaded with API Keys:", imgUrl);
          } else {
            throw new Error(retryData.error?.reason || "API Key authentication also failed");
          }
        } else {
          throw new Error(data.error?.reason || "Authentication failed");
        }
      } else if (data?.IpfsHash) {
        const imgUrl = `https://${GATEWAY_URL}/ipfs/${data.IpfsHash}`;
        Alert.alert(
          "✅ Upload Successful", 
          `Image uploaded to IPFS!\n\nMethod: ${method}\nIPFS Hash: ${data.IpfsHash}`
        );
        console.log(`✅ Uploaded with ${method}:`, imgUrl);
      } else {
        throw new Error(data.error?.reason || "No IPFS hash returned");
      }
    } catch (error: any) {
      console.error("❌ Upload failed:", error);
      
      if (error.message.includes("revoked") || error.message.includes("invalid") || error.message.includes("malformed")) {
        Alert.alert(
          "Authentication Error", 
          "Your Pinata credentials are invalid or revoked.\n\nPlease generate new credentials in your Pinata dashboard.",
          [
            {
              text: "Open Pinata",
              onPress: () => {
                // You can use Linking.openURL if needed
                console.log("Redirect to Pinata dashboard");
              }
            },
            { text: "OK", style: "cancel" }
          ]
        );
      } else {
        Alert.alert(
          "Upload Failed", 
          error.message || "Please check your internet connection and try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔧 Show Configuration Status
  const showConfigStatus = () => {
    const { hasJWT, hasAPIKeys } = checkCredentials();
    
    let message = "Current Configuration:\n\n";
    message += `JWT Token: ${hasJWT ? "✅ Configured" : "❌ Missing"}\n`;
    message += `API Keys: ${hasAPIKeys ? "✅ Configured" : "❌ Missing"}\n\n`;
    message += `Using: ${hasJWT && usingJWT ? "JWT Token" : "API Keys"}\n\n`;
    
    if (hasJWT) {
      message += `JWT Preview: ${PINATA_JWT.substring(0, 30)}...\n`;
    }
    
    Alert.alert("Configuration Status", message);
  };

  // 📋 Setup Instructions
  const showSetupInstructions = () => {
    Alert.alert(
      "Pinata Setup Guide",
      "1. Go to Pinata.cloud and sign in\n2. Navigate to Developers → API Keys\n3. Generate new JWT Token or API Keys\n4. Update your .env file with the new credentials\n5. Restart the app",
      [
        { text: "OK", style: "cancel" }
      ]
    );
  };

  // 🧪 Test JWT Token
  const testJWTToken = async () => {
    const { hasJWT } = checkCredentials();
    
    if (!hasJWT) {
      Alert.alert("No JWT", "JWT token not detected in configuration.");
      return;
    }

    try {
      setLoading(true);
      console.log("🧪 Testing JWT token...");
      
      const response = await fetch('https://api.pinata.cloud/data/testAuthentication', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT}`
        }
      });
      
      const result = await response.json();
      console.log('JWT Test result:', result);
      
      if (response.ok) {
        Alert.alert('✅ JWT Valid', 'Your JWT token is working correctly!');
      } else {
        Alert.alert('❌ JWT Invalid', result.error?.reason || 'JWT authentication failed');
      }
    } catch (error) {
      console.error('JWT test failed:', error);
      Alert.alert('Test Failed', 'Cannot test JWT token. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.header}>Create New Playlist</Text>

        {/* Configuration Status */}
        <View style={styles.configSection}>
          <TouchableOpacity style={styles.configButton} onPress={showConfigStatus}>
            <Ionicons name="settings-outline" size={20} color="#007AFF" />
            <Text style={styles.configText}>Check Configuration</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testJWTToken} disabled={loading}>
            <Text style={styles.testText}>Test JWT</Text>
          </TouchableOpacity>
        </View>

        {/* 🖼️ Image Section */}
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

        {/* 📸 Action Buttons */}
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

        {/* 🚀 Analyze / Upload Button */}
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

        {/* 🔧 Setup Instructions */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={showSetupInstructions}
        >
          <Text style={styles.helpText}>Need Help Setting Up Pinata?</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Bottom Navigation */}
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
  safeContainer: { flex: 1, backgroundColor: "#000" },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  header: {
    color: "#1DB954",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  configSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  configButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#333",
    marginRight: 5,
  },
  configText: {
    color: "#007AFF",
    marginLeft: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  testButton: {
    flex: 1,
    backgroundColor: "#5856D6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5,
  },
  testText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  imageContainer: {
    backgroundColor: "#111",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#222",
  },
  placeholderBox: { 
    height: 200, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  placeholderText: { 
    color: "#555", 
    fontSize: 14, 
    marginTop: 8 
  },
  imagePreview: { 
    width: "100%", 
    height: 200 
  },
  fileButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
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
  iconText: { 
    color: "#fff", 
    marginLeft: 10, 
    fontSize: 15, 
    fontWeight: "600" 
  },
  createButton: {
    backgroundColor: "#1DB954",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 15,
  },
  createText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
    textTransform: "uppercase",
  },
  helpButton: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#666",
  },
  helpText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
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
  navItem: { 
    alignItems: "center" 
  },
});