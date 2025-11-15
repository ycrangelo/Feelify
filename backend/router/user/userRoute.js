import express from "express";
import { get,getBy } from "../../controller/user /get/get.js";
import { post } from "../../controller/user /post/post.js";


console.log("spotifyROute: express import ok");
const router = express.Router()


router.get("/_debug/user", (req, res) => {
  res.json({ ok: true, route: "/api/v1/album/_debug/user" });
});

router.post("/post",post)
router.post("/get",get)
router.post("/getBy",getBy)

export default router;