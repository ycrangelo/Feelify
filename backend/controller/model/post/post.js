export async function postAi(req,res){
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
        const songSuggestions = await getAiSongSuggestions(emotionData);
    
        // Step 6: Return both emotion analysis and song suggestions as array
        const responseArray = [
          {
            type: "emotion_analysis",
            data: emotionData,
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
}

async function getAiSongSuggestions(emotionData) {
  try {
    const emotionDescription = Object.entries(emotionData)
      .map(([emotion, score]) => `${emotion}: ${score}`)
      .join(', ');

    const songPrompt = `
    EMOTION ANALYSIS:
    ${emotionDescription}

    GUIDELINES FOR PLAYLIST GENERATION:

    🎯 INTERPRETATION:
    - Analyze the COMPLETE emotional profile, not just dominant emotions
    - Consider emotional contrasts and nuances in the blend
    - Balance between validating current feelings and providing emotional resolution
    - Match musical characteristics to emotional intensities

    🎵 MUSICAL MAPPING:
    • High Energy + Positive (happy, surprised): Upbeat pop, dance, energetic tracks
    • High Energy + Negative (angry): Powerful anthems, rock, intense hip-hop
    • Low Energy + Positive (content): Chill vibes, acoustic, soothing melodies  
    • Low Energy + Negative (sad, fear): Emotional ballads, reflective, atmospheric
    • Mixed/Neutral: Balanced blend of uplifting and contemplative

    🌍 ARTIST REPERTOIRE (Expanded & Diverse):

    WESTERN POP/R&B/ALTERNATIVE:
    • Emotional Ballads: Adele, Sam Smith, Lewis Capaldi, Sia, James Bay, Birdy
    • Upbeat Pop: Dua Lipa, Doja Cat, Lizzo, Ariana Grande, Charlie Puth, Justin Bieber
    • Reflective/Chill: Billie Eilish, Lana Del Rey, Lorde, Halsey, Clairo, Gracie Abrams
    • R&B/Soul: SZA, The Weeknd, Frank Ocean, Daniel Caesar, H.E.R., Jhené Aiko
    • Indie/Alternative: Phoebe Bridgers, Bon Iver, Arctic Monkeys, Tame Impala, Florence + The Machine
    • Hip-Hop/Rap: Drake, Kendrick Lamar, J. Cole, Post Malone, Travis Scott, Kanye West
    • Rock/Alternative: Imagine Dragons, Coldplay, Twenty One Pilots, Linkin Park, Paramore

    K-POP (Various Moods):
    • Emotional: BTS ("Spring Day"), IU ("Through the Night"), AKMU ("How can I love the heartbreak")
    • Energetic: BLACKPINK, TWICE, ITZY, Stray Kids, SEVENTEEN
    • Chill/Vibey: NewJeans, HEIZE, DEAN, Crush, BOL4
    • Powerful: ATEEZ, (G)I-DLE, MAMAMOO, SUNMI

    J-POP/ANIME:
    • Emotional: YOASOBI, Aimer, LiSA, Kenshi Yonezu, Official HIGE DANDism
    • Uplifting: Mrs. GREEN APPLE, back number, I Don't Like Mondays.
    • Atmospheric: RADWIMPS, Eve, Yorushika

    OPM (FILIPINO MUSIC):
    • Heartfelt: Moira Dela Torre, Ben&Ben, December Avenue, Clara Benin
    • Contemporary: Zack Tabudlo, Arthur Nery, Adie, Juan Karlos, Al James
    • Energetic: SB19, P-Pop Generation, BINI, BGYO
    • OPM Classics: Eraserheads, Parokya ni Edgar, Rivermaya, Sponge Cola

    INTERNATIONAL:
    • Latin: Bad Bunny, J Balvin, Rosalía, Shakira
    • UK/EU: Ed Sheeran, Dermot Kennedy, RAYE, Måneskin, Stromae
    • Country: Taylor Swift, Kacey Musgraves, Luke Combs, Morgan Wallen

    🎼 EMOTION-SPECIFIC RECOMMENDATIONS:

    For HIGH HAPPINESS (>0.6):
    - Celebration anthems, dance tracks, feel-good pop
    - Artists: Lizzo, Doja Cat, Bruno Mars, TWICE, BINI

    For PROMINENT SADNESS (>0.4):
    - Emotional ballads, comforting melodies, cathartic tracks
    - Artists: Adele, Lewis Capaldi, Moira Dela Torre, IU

    For ANGER/FEAR (>0.3):
    - Powerful releases, intense beats, empowering anthems
    - Artists: Demi Lovato, Imagine Dragons, ATEEZ, Paramore

    For MIXED/CONTEMPLATIVE:
    - Balanced blend: 40% uplifting, 40% reflective, 20% atmospheric
    - Artists: Taylor Swift, Coldplay, Ben&Ben, NewJeans

    For NEUTRAL DOMINANT:
    - Versatile mix: Current hits, viral tracks, mood-adaptable songs
    - Artists: Olivia Rodrigo, The Weeknd, Zack Tabudlo, YOASOBI

    📊 PLAYLIST STRUCTURE:
    - 15 songs total
    - Emotional journey: Start with validation → emotional exploration → resolution/hope
    - Mix of tempos and energies appropriate to the emotional blend
    - Include both lyrical relevance and musical mood matching

    🎵 OUTPUT REQUIREMENTS:
    Generate EXACTLY 15 songs that create a cohesive emotional journey based on the specific emotion scores provided.

    Return ONLY a JSON array in this exact format:
    [
      {
        "title": "Song Title",
        "artist": "Artist Name"
      }
    ]

    No additional text, explanations, or formatting outside the JSON array.
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
            temperature: 0.8,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const songResult = await geminiResponse.json();
    console.log("🎵 Song Suggestions Response:", JSON.stringify(songResult, null, 2));

    if (songResult.error) {
      throw new Error(songResult.error.message);
    }

    const songOutput = songResult?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!songOutput) {
      throw new Error("No song suggestions returned by AI");
    }

    let songSuggestions;
    try {
      songSuggestions = JSON.parse(songOutput.trim());
    } catch (e) {
      console.warn("⚠️ Song output not pure JSON. Trying to extract JSON...");
      const jsonMatch = songOutput.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        songSuggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse song suggestions JSON");
      }
    }

    if (songSuggestions.length > 7) {
      songSuggestions = songSuggestions.slice(0, 7);
    }

    return songSuggestions;

  } catch (error) {
    console.error("❌ AI song suggestions error:", error);
    // Use fallback if AI fails
    return getFallbackSongSuggestions();
  }
}
// function getFallbackSongSuggestions(dominantEmotion){
//       const fallbackSuggestions = {
//     happy: [
//       { title: "Happy", artist: "Pharrell Williams", genre: "Pop", reason: "Uplifting and positive vibe" },
//       { title: "Can't Stop the Feeling!", artist: "Justin Timberlake", genre: "Pop", reason: "Energetic and joyful" },
//       { title: "Good Vibrations", artist: "The Beach Boys", genre: "Pop/Rock", reason: "Classic feel-good song" },
//       { title: "Walking on Sunshine", artist: "Katrina & The Waves", genre: "Pop Rock", reason: "Perfect for happy moments" },
//       { title: "Dancing Queen", artist: "ABBA", genre: "Pop/Disco", reason: "Celebratory and fun" },
//       { title: "Uptown Funk", artist: "Mark Ronson ft. Bruno Mars", genre: "Funk/Pop", reason: "Groovy and energetic" },
//       { title: "I Gotta Feeling", artist: "The Black Eyed Peas", genre: "Pop/Dance", reason: "Party anthem for good times" }
//     ],
//     sad: [
//       { title: "Someone Like You", artist: "Adele", genre: "Pop/Soul", reason: "Emotional and cathartic" },
//       { title: "The Sound of Silence", artist: "Simon & Garfunkel", genre: "Folk Rock", reason: "Reflective and melancholic" },
//       { title: "All I Want", artist: "Kodaline", genre: "Indie Rock", reason: "Heartfelt and emotional" },
//       { title: "Fix You", artist: "Coldplay", genre: "Alternative Rock", reason: "Comforting and hopeful" },
//       { title: "Say Something", artist: "A Great Big World", genre: "Pop", reason: "Vulnerable and emotional" },
//       { title: "Skinny Love", artist: "Bon Iver", genre: "Indie Folk", reason: "Raw and intimate" },
//       { title: "Hurt", artist: "Johnny Cash", genre: "Country", reason: "Powerful and emotional" }
//     ],
//     angry: [
//       { title: "Killing In The Name", artist: "Rage Against The Machine", genre: "Rap Metal", reason: "Intense and cathartic" },
//       { title: "Break Stuff", artist: "Limp Bizkit", genre: "Nu Metal", reason: "Aggressive release" },
//       { title: "Given Up", artist: "Linkin Park", genre: "Alternative Metal", reason: "Raw emotional intensity" },
//       { title: "Bulls on Parade", artist: "Rage Against The Machine", genre: "Rap Metal", reason: "Powerful and aggressive" },
//       { title: "Duality", artist: "Slipknot", genre: "Heavy Metal", reason: "High-energy release" },
//       { title: "Last Resort", artist: "Papa Roach", genre: "Nu Metal", reason: "Intense emotional expression" },
//       { title: "Bodies", artist: "Drowning Pool", genre: "Nu Metal", reason: "Powerful and energetic" }
//     ],
//     surprised: [
//       { title: "Somebody That I Used To Know", artist: "Gotye", genre: "Indie Pop", reason: "Unexpected twists" },
//       { title: "Take On Me", artist: "a-ha", genre: "Synth-pop", reason: "Surprising energy shifts" },
//       { title: "Bohemian Rhapsody", artist: "Queen", genre: "Rock", reason: "Unpredictable structure" },
//       { title: "Hey Ya!", artist: "Outkast", genre: "Hip Hop", reason: "Unexpectedly upbeat" },
//       { title: "Seven Nation Army", artist: "The White Stripes", genre: "Rock", reason: "Iconic and surprising" },
//       { title: "Feel It Still", artist: "Portugal. The Man", genre: "Alternative", reason: "Catchy and unexpected" },
//       { title: "Pumped Up Kicks", artist: "Foster The People", genre: "Indie Pop", reason: "Contrasting mood" }
//     ],
//     neutral: [
//       { title: "Weightless", artist: "Marconi Union", genre: "Ambient", reason: "Calming and balanced" },
//       { title: "Bloom", artist: "The Paper Kites", genre: "Indie Folk", reason: "Gentle and peaceful" },
//       { title: "Holocene", artist: "Bon Iver", genre: "Indie Folk", reason: "Reflective and calm" },
//       { title: "To Build a Home", artist: "The Cinematic Orchestra", genre: "Ambient", reason: "Peaceful and introspective" },
//       { title: "First Day of My Life", artist: "Bright Eyes", genre: "Indie Folk", reason: "Simple and heartfelt" },
//       { title: "The Night We Met", artist: "Lord Huron", genre: "Indie Folk", reason: "Calm and reflective" },
//       { title: "Rivers and Roads", artist: "The Head and the Heart", genre: "Indie Folk", reason: "Balanced and moving" }
//     ]
//   };

//   return fallbackSuggestions[dominantEmotion] || fallbackSuggestions.neutral;
// }