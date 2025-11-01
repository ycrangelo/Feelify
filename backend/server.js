import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import albumRoutes from "./router/album/albumRoutes.js"
import spotifyRoute from "./router/spoitfy/spotifyRoute.js"

dotenv.config();
const app = express();

// 🧩 Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Debug: log incoming requests
app.use((req, res, next) => {
  console.log("REQ", req.method, req.path);
  next();
});

// 🎧 Spotify Token Exchange
// app.post("/auth/spotify/token", async (req, res) => {
//   const { code } = req.body;
//   if (!code) return res.status(400).json({ error: "Authorization code is required." });

//   const params = new URLSearchParams({
//     grant_type: "authorization_code",
//     code,
//     redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
//     client_id: process.env.SPOTIFY_CLIENT_ID,
//     client_secret: process.env.SPOTIFY_CLIENT_SECRET,
//   });

//   try {
//     const response = await fetch("https://accounts.spotify.com/api/token", {
//       method: "POST",
//       headers: { "Content-Type": "application/x-www-form-urlencoded" },
//       body: params,
//     });

//     const data = await response.json();
//     if (data.error) return res.status(400).json({ error: "Spotify token exchange failed", details: data });

//     console.log("✅ Spotify token exchange successful");
//     res.json(data);
//   } catch (err) {
//     console.error("❌ Spotify token exchange error:", err);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// });

// 🧠 Emotion Analysis Route using Gemini 2.5 Flash
app.post("/analyze/emotion", async (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required." });
  }

  // Validate URL format
  try {
    new URL(imageUrl);
  } catch (e) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    console.log("🖼️ Fetching image from:", imageUrl);
    
    // 🖼️ Step 1: Fetch image with better error handling and headers
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!imageResponse.ok) {
      console.error(`❌ Image fetch failed: ${imageResponse.status} ${imageResponse.statusText}`);
      return res.status(400).json({ 
        error: `Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}` 
      });
    }

    // Check content type
    const contentType = imageResponse.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      console.error(`❌ Invalid content type: ${contentType}`);
      return res.status(400).json({ error: "URL does not point to a valid image" });
    }

    console.log("✅ Image fetched successfully, content type:", contentType);
    
    const arrayBuffer = await imageResponse.arrayBuffer();
    
    // Check if image is too large (Gemini has limits)
    if (arrayBuffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
      return res.status(400).json({ error: "Image too large. Maximum size is 10MB." });
    }

    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    console.log(`✅ Image converted to base64, size: ${base64Image.length} characters`);

    // 🧠 Step 2: Send request to Gemini for emotion analysis
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Analyze this face and return ONLY JSON with emotion scores (0-1). Keys: happy, sad, angry, surprised, disgust, fear, neutral. No other text.`,
                },
                {
                  inline_data: {
                    mime_type: contentType || "image/jpeg",
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 150,
          },
        }),
      }
    );

    const emotionResult = await geminiResponse.json();
    console.log("Emotion Analysis Response:", JSON.stringify(emotionResult, null, 2));

    if (emotionResult.error) {
      console.error("❌ Emotion analysis error:", emotionResult.error);
      return res.status(400).json({ 
        error: "Emotion analysis failed", 
        details: emotionResult.error 
      });
    }

    // Step 3: Extract emotion analysis output
    const emotionOutput = emotionResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!emotionOutput) {
      console.log("⚠️ No emotion analysis output from Gemini");
      return res.status(400).json({ error: "No emotion analysis result from Gemini." });
    }

    // Step 4: Parse emotion data
    let emotionData;
    try {
      emotionData = JSON.parse(emotionOutput.trim());
    } catch (e) {
      console.warn("⚠️ Emotion output was not JSON, attempting to extract JSON from text:", emotionOutput);
      const jsonMatch = emotionOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          emotionData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("❌ Failed to parse emotion JSON:", parseError);
          return res.status(400).json({ error: "Failed to parse emotion data" });
        }
      } else {
        return res.status(400).json({ error: "No valid emotion data found" });
      }
    }

    console.log("🧠 Emotion Analysis Result:", emotionData);

    // 🎵 Step 5: Get song suggestions based on emotions using AI
    const dominantEmotion = getDominantEmotion(emotionData);
    const songSuggestions = await getAISongSuggestions(emotionData, dominantEmotion);

    // Step 6: Return both emotion analysis and song suggestions as array
    const responseArray = [
      {
        type: "emotion_analysis",
        data: emotionData,
        dominant_emotion: dominantEmotion
      },
      {
        type: "song_suggestions", 
        data: songSuggestions
      }
    ];

    console.log("🎵 Final Response:", JSON.stringify(responseArray, null, 2));
    res.json(responseArray);

  } catch (error) {
    console.error("❌ Emotion analysis error:", error);
    res.status(500).json({ 
      error: "Failed to analyze emotions and generate suggestions.",
      details: error.message 
    });
  }
});

// Function to get dominant emotion
function getDominantEmotion(emotionData) {
  let maxScore = 0;
  let dominantEmotion = 'neutral';
  
  for (const [emotion, score] of Object.entries(emotionData)) {
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotion;
    }
  }
  
  return dominantEmotion;
}

// Function to get AI-generated song suggestions
async function getAISongSuggestions(emotionData, dominantEmotion) {
  try {
    const emotionDescription = Object.entries(emotionData)
      .map(([emotion, score]) => `${emotion}: ${score}`)
      .join(', ');

    const songPrompt = `
      Based on these emotion scores: ${emotionDescription}. 
      The dominant emotion is: ${dominantEmotion}.
      
      Please suggest 7 songs that would match this emotional state. 
      Return ONLY a JSON array of objects with this exact format:
      [
        {
          "title": "Song Title",
          "artist": "Artist Name", 
          "genre": "Music Genre",
          "reason": "Brief explanation of why this song matches the emotions"
        }
      ]
      
      No other text, just the JSON array.
    `;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: songPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const songResult = await geminiResponse.json();
    console.log("Song Suggestions Response:", JSON.stringify(songResult, null, 2));

    if (songResult.error) {
      throw new Error(songResult.error.message);
    }

    const songOutput = songResult?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!songOutput) {
      throw new Error("No song suggestions from AI");
    }

    let songSuggestions;
    try {
      songSuggestions = JSON.parse(songOutput.trim());
    } catch (e) {
      console.warn("⚠️ Song output was not JSON, attempting to extract JSON:", songOutput);
      const jsonMatch = songOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        songSuggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse song suggestions");
      }
    }

    // Ensure we have exactly 7 songs
    if (songSuggestions.length > 7) {
      songSuggestions = songSuggestions.slice(0, 7);
    }

    return songSuggestions;

  } catch (error) {
    console.error("❌ AI song suggestions error:", error);
    // Return fallback suggestions if AI fails
    return getFallbackSongSuggestions(dominantEmotion);
  }
}

// Fallback song suggestions in case AI fails
function getFallbackSongSuggestions(dominantEmotion) {
  const fallbackSuggestions = {
    happy: [
      { title: "Happy", artist: "Pharrell Williams", genre: "Pop", reason: "Uplifting and positive vibe" },
      { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", genre: "Pop", reason: "Energetic and joyful" },
      { title: "Good Vibrations", artist: "The Beach Boys", genre: "Pop/Rock", reason: "Classic feel-good song" },
      { title: "Walking on Sunshine", artist: "Katrina & The Waves", genre: "Pop Rock", reason: "Perfect for happy moments" },
      { title: "Dancing Queen", artist: "ABBA", genre: "Pop/Disco", reason: "Celebratory and fun" },
      { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", genre: "Funk/Pop", reason: "Groovy and energetic" },
      { title: "I Gotta Feeling", artist: "The Black Eyed Peas", genre: "Pop/Dance", reason: "Party anthem for good times" }
    ],
    sad: [
      { title: "Someone Like You", artist: "Adele", genre: "Pop/Soul", reason: "Emotional and cathartic" },
      { title: "The Sound of Silence", artist: "Simon & Garfunkel", genre: "Folk Rock", reason: "Reflective and melancholic" },
      { title: "All I Want", artist: "Kodaline", genre: "Indie Rock", reason: "Heartfelt and emotional" },
      { title: "Fix You", artist: "Coldplay", genre: "Alternative Rock", reason: "Comforting and hopeful" },
      { title: "Say Something", artist: "A Great Big World", genre: "Pop", reason: "Vulnerable and emotional" },
      { title: "Skinny Love", artist: "Bon Iver", genre: "Indie Folk", reason: "Raw and intimate" },
      { title: "Hurt", artist: "Johnny Cash", genre: "Country", reason: "Powerful and emotional" }
    ],
    angry: [
      { title: "Killing In The Name", artist: "Rage Against The Machine", genre: "Rap Metal", reason: "Intense and cathartic" },
      { title: "Break Stuff", artist: "Limp Bizkit", genre: "Nu Metal", reason: "Aggressive release" },
      { title: "Given Up", artist: "Linkin Park", genre: "Alternative Metal", reason: "Raw emotional intensity" },
      { title: "Bulls on Parade", artist: "Rage Against The Machine", genre: "Rap Metal", reason: "Powerful and aggressive" },
      { title: "Duality", artist: "Slipknot", genre: "Heavy Metal", reason: "High-energy release" },
      { title: "Last Resort", artist: "Papa Roach", genre: "Nu Metal", reason: "Intense emotional expression" },
      { title: "Bodies", artist: "Drowning Pool", genre: "Nu Metal", reason: "Powerful and energetic" }
    ],
    surprised: [
      { title: "Somebody That I Used To Know", artist: "Gotye", genre: "Indie Pop", reason: "Unexpected twists" },
      { title: "Take On Me", artist: "a-ha", genre: "Synth-pop", reason: "Surprising energy shifts" },
      { title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock", reason: "Unpredictable structure" },
      { title: "Hey Ya!", artist: "Outkast", genre: "Hip Hop", reason: "Unexpectedly upbeat" },
      { title: "Seven Nation Army", artist: "The White Stripes", genre: "Rock", reason: "Iconic and surprising" },
      { title: "Feel It Still", artist: "Portugal. The Man", genre: "Alternative", reason: "Catchy and unexpected" },
      { title: "Pumped Up Kicks", artist: "Foster The People", genre: "Indie Pop", reason: "Contrasting mood" }
    ],
    neutral: [
      { title: "Weightless", artist: "Marconi Union", genre: "Ambient", reason: "Calming and balanced" },
      { title: "Bloom", artist: "The Paper Kites", genre: "Indie Folk", reason: "Gentle and peaceful" },
      { title: "Holocene", artist: "Bon Iver", genre: "Indie Folk", reason: "Reflective and calm" },
      { title: "To Build a Home", artist: "The Cinematic Orchestra", genre: "Ambient", reason: "Peaceful and introspective" },
      { title: "First Day of My Life", artist: "Bright Eyes", genre: "Indie Folk", reason: "Simple and heartfelt" },
      { title: "The Night We Met", artist: "Lord Huron", genre: "Indie Folk", reason: "Calm and reflective" },
      { title: "Rivers and Roads", artist: "The Head and the Heart", genre: "Indie Folk", reason: "Balanced and moving" }
    ]
  };

  return fallbackSuggestions[dominantEmotion] || fallbackSuggestions.neutral;
}

// 🧪 Test route with a simple image test
app.get("/test-image", async (req, res) => {
  try {
    const testImageUrl = "https://i.imgur.com/fhtXyYJ.png";
    console.log("🧪 Testing image fetch:", testImageUrl);
    
    const response = await fetch(testImageUrl);
    if (response.ok) {
      res.json({ 
        success: true, 
        message: "Image URL is accessible",
        contentType: response.headers.get('content-type'),
        status: response.status
      });
    } else {
      res.json({ 
        success: false, 
        message: "Image URL is not accessible",
        status: response.status,
        statusText: response.statusText
      });
    }
  } catch (error) {
    res.json({ 
      success: false, 
      message: "Image fetch failed",
      error: error.message 
    });
  }
});


// 🧪 Test route
app.get("/", async (req, res) => {
  res.send("🎧 Feelify Backend is running with Spotify + Gemini Emotion Detection!");
});

console.log("server: mounting /api/v1/album routes", typeof albumRoutes);
app.use('/api/v1/album', albumRoutes)
app.use('/api/v1/auth', spotifyRoute)
// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});