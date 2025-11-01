import prisma from "../../../prismaClient.js";

export async function post(req, res) {
  try {
    const { dominantEmotion, picUrl, userId, createdBy, albumId, albumName } = req.body;

    if (!dominantEmotion || !picUrl || !userId || !createdBy || !albumId || !albumName) {
      return res.status(401).json({ error: "Missing required field" });
    }

    const album = await prisma.album.create({
      data: {
        dominantEmotion,
        albumName,
        picUrl,
        userId,
        createdBy,
        albumId,
      },
    });

    const createHistory = await prisma.history.create({
      data: {
        userId,
        createdBy,
        verb: `created an album ${albumName}`,
      },
    });

    res.status(201).json({ data: album });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to post album" });
  }
}
