import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";

export default function Home() {
  const handleLogin = () => {
    console.log("Continue with Spotify pressed");
  };

  return (
    <ImageBackground
      source={require("../assets/background.jpg")}
      style={styles.background}
      blurRadius={6}
    >
      <View style={styles.overlay}>
        {/* Feelify Title */}
        <Text style={styles.logoText}>Feelify</Text>

        <Text style={styles.subtitle}>HOME TO PRE</Text>
        <Link href="/">View details</Link>
        {/* Continue with Spotify Button */}
        <TouchableOpacity activeOpacity={0.9} onPress={handleLogin} style={styles.buttonWrapper}>
          <LinearGradient
            colors={["#1DB954", "#1ed760"]} // Spotify gradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            <Image source={require("../assets/spotify_icon.png")} style={styles.icon} />
            <Text style={styles.loginText}>Continue with Spotify</Text>
          </LinearGradient>
        </TouchableOpacity>

        <StatusBar style="light" />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logoText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#1DB954",
    marginBottom: 10,
    textShadowColor: "rgba(29, 185, 84, 0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    color: "#fff",
    fontSize: 18,
    opacity: 0.8,
    textAlign: "center",
    marginBottom: "40%",
  },
  buttonWrapper: {
    width: "80%",
    borderRadius: 50,
    overflow: "hidden", // ensures gradient stays round
  },
  loginButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: "#1DB954",
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 10,
    elevation: 8,
  },
  icon: {
    width: 26,
    height: 26,
    marginRight: 12,
    tintColor: "#fff",
  },
  loginText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
