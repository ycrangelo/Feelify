import prisma from "../../../../prismaClient.js";

export async function getLikes(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Missing album id" });
    }

    // Find the album using the internal `id`
    const album = await prisma.album.findUnique({
      where: { id },
      select: { likes: true, albumName: true },
    });

    if (!album) {
      return res.status(404).json({ error: "Album not found" });
    }

    return res.status(200).json({
      message: "Album likes fetched successfully",
      data: album,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Failed to fetch album likes" });
  }
}