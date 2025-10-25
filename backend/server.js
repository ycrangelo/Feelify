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

// 🧠 Lazy-load the ONNX emotion detection model
let classifier;
let modelLoaded = false;

async function getClassifier() {
  if (!classifier) {
    console.log("🕒 Loading lightweight ONNX emotion detection model...");
    classifier = await pipeline("image-classification", "Xenova/facial_emotions_image_detection");
    modelLoaded = true;
    console.log("✅ Emotion model loaded successfully (ONNX)");
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

    // ✅ Validate image URL (must be direct)
    if (!/\.(jpg|jpeg|png)$/i.test(imageUrl)) {
      return res.status(400).json({
        error: "Invalid image URL. Must be a direct image (e.g., ends with .jpg or .png).",
      });
    }

    const model = await getClassifier();
    const results = await model(imageUrl, { topk: 3 }); // top 3 emotions
    res.json(results);
  } catch (err) {
    console.error("❌ Emotion detection failed:", err);
    res.status(500).json({
      error: "Emotion detection failed",
      details: err.message,
    });
  }
});

// 🎧 Spotify Token Exchange
app.post("/auth/spotify/token", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Authorization code is required." });
  }

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

// 🧪 Test Route
app.get("/", async (req, res) => {
  if (!modelLoaded) {
    res.send("🎧 Feelify Backend is starting up... Model is loading ⏳");
  } else {
    res.send("🎧 Feelify Backend is running with Spotify + ONNX Emotion Detection!");
  }
});

// 🔥 Keep model warm every 15 minutes (avoid Render cold start)
setInterval(async () => {
  try {
    await getClassifier();
    console.log("🔥 Model kept warm");
  } catch (e) {
    console.error("⚠️ Warm-up failed:", e.message);
  }
}, 15 * 60 * 1000);

// 🚀 Start Server with delayed preload (Render startup-safe)
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("🕒 Delaying model load to avoid Render timeout...");

  // Preload model in background after startup
  setTimeout(async () => {
    try {
      await getClassifier();
    } catch (err) {
      console.error("⚠️ Model preload failed:", err.message);
    }
  }, 15000); // wait 15s before preloading
});
