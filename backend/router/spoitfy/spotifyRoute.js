import express from "express";
import { spotifyLogin } from "../../controller/spotify/login/login.js";


console.log("spotifyROute: express import ok");
const router = express.Router()


router.get("/_debug/spotify", (req, res) => {
  res.json({ ok: true, route: "/api/v1/album/_debug/spotify" });
});

router.post("/spotify/token",spotifyLogin)

export default router;