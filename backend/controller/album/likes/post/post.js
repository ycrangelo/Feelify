import prisma from "../../../../prismaClient.js";

export async function postLike(req, res) {
  try {
    const { albumId } = req.body;

    if (!albumId) {
      return res.status(400).json({ error: "Missing albumId" });
    }

    // Find the album by your custom albumId field
    const album = await prisma.album.findFirst({
      where: { albumId: albumId },
    });

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    // Update using the internal Mongo _id (which is valid)
    const updatedAlbum = await prisma.album.update({
      where: { id: album.id },
      data: { likes: { increment: 1 } },
    });

    return res
      .status(200)
      .json({ message: "Album liked successfully", data: updatedAlbum });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to like album" });
  }
}
