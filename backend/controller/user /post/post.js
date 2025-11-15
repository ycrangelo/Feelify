import prisma from "../../../prismaClient.js";

export async function post(req, res) {
  try {
    const { display_name, spotify_id, country, genres } = req.body;

    // Validate required fields
    if (!display_name || !spotify_id || !country || !genres || !Array.isArray(genres)) {
      return res.status(400).json({ error: "Missing or invalid required fields" });
    }

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        display_name,
        spotify_id,
        country,
        genres,
      },
    });

    res.status(201).json({ data: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
}
