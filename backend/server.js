import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import albumRoutes from "./router/album/albumRoutes.js"
import spotifyRoute from "./router/spoitfy/spotifyRoute.js"
import modelRoute from "./router/model/modelRoute.js"
import userRoute from "./router/user/userRoute.js"

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

// 🧪 Test route
app.get("/", async (req, res) => {
  res.send("🎧 Feelify Backend is running with Spotify + Gemini Emotion Detection!");
});

console.log("server: mounting /api/v1/album routes", typeof albumRoutes);
console.log("server: mounting /api/v1/auth routes", typeof spotifyRoute);
console.log("server: mounting /api/v1/model routes", typeof modelRoute);
console.log("server: mounting /api/v1/user routes", typeof userRoute);

app.use('/api/v1/album', albumRoutes)
app.use('/api/v1/auth', spotifyRoute)
app.use('/api/v1/model', modelRoute)
app.use('/api/v1/model', userRoute)
// 🚀 Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});