
export async function spotifyLogin(req,res){
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
}