import express from "express";
import { post } from "../../controller/album/post/post.js";
import { get,getBy } from "../../controller/album/get/get.js";
import { postLike } from "../../controller/album/likes/post/post.js";
import { getLikes } from "../../controller/album/likes/get/get.js";


console.log("albumRoutes: express import ok");
const router = express.Router()

// Debug: confirm router file is loaded
console.log("albumRoutes: loaded");

router.get("/_debug", (req, res) => {
  res.json({ ok: true, route: "/api/v1/album/_debug" });
});

router.post("/post", post)
router.get("/get",get)
router.get("/get/:userId",getBy)
router.post("/post/like",postLike)
router.get("/get/like",getLikes)

export default router;