import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

dotenv.config();
const app = express();

// 🧩 Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// 🎧 Spotify Token Exchange
app.post("/auth/spotify/token", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Authorization code is required." });

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await response.json();
    if (data.error) return res.status(400).json({ error: "Spotify token exchange failed", details: data });

    console.log("✅ Spotify token exchange successful");
    res.json(data);
  } catch (err) {
    console.error("❌ Spotify token exchange error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🧪 Test route
app.get("/", async (req, res) => {
  if (!modelLoaded) {
    res.send("🎧 Feelify Backend is starting up... Model is loading ⏳");
  } else {
    res.send("🎧 Feelify Backend is running with Spotify + ONNX Emotion Detection!");
  }
});

// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
