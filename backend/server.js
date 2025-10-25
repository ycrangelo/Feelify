import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import { pipeline } from "@xenova/transformers";

dotenv.config();
const app = express();

// 🧩 Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// 🧠 Lazy-load the emotion detection model
let classifier;
async function getClassifier() {
  if (!classifier) {
    console.log("🔄 Loading emotion detection model...");
    classifier = await pipeline("image-classification", "Xenova/facial_emotions_image_detection");
    console.log("✅ Emotion model loaded successfully");
  }
  return classifier;
}

// 🧠 Emotion Detection Endpoint
app.post("/detect-emotion", async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required." });
    }

    const model = await getClassifier();
    const results = await model(imageUrl, { topk: 3 }); // Get top 3 emotions
    res.json(results);
  } catch (err) {
    console.error("❌ Emotion detection failed:", err);
    res.status(500).json({ error: "Emotion detection failed", details: err.message });
  }
});

// 🎧 Spotify Token Exchange
app.post("/auth/spotify/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required." });
  }

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", process.env.SPOTIFY_REDIRECT_URI);
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await response.json();

    if (data.error) {
      console.error("Spotify API error:", data);
      return res.status(400).json({ error: "Spotify token exchange failed", details: data });
    }

    console.log("✅ Spotify token exchange successful");
    res.json(data);
  } catch (error) {
    console.error("❌ Spotify token exchange error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🧪 Test route
app.get("/", (req, res) => {
  res.send("🎧 Feelify Backend is running with Spotify + Emotion Detection!");
});

// 🚀 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
