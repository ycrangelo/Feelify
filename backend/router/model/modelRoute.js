import express from "express";
import { postAi } from "../../controller/model/post/post.js";


console.log("modelROute: express import ok");
const router = express.Router()


router.get("/_debug/model", (req, res) => {
  res.json({ ok: true, route: "/api/v1/album/_debug/spotify" });
});

router.post("/prompt",postAi)

export default router;