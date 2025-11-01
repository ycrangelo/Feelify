import express from "express";
import { post } from "../../controller/album/post/post.js";

console.log("albumRoutes: express import ok");
const router = express.Router()

// Debug: confirm router file is loaded
console.log("albumRoutes: loaded");

router.get("/_debug", (req, res) => {
  res.json({ ok: true, route: "/api/v1/album/_debug" });
});

router.post("/post", post)

export default router;