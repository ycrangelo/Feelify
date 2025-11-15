import prisma from "../../../prismaClient.js";

// Get all users
export async function get(req, res) {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json({ data: users });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to get users" });
  }
}

// Get user by Spotify ID
    export async function getBy(req, res) {
    try {
        const { spotify_id } = req.params;

        if (!spotify_id) {
        return res.status(400).json({ error: "Missing spotify_id" });
        }

        const user = await prisma.user.findFirst({
        where: { spotify_id },
        });

        if (!user) {
        return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ data: user });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to get user by spotify_id" });
    }
    }