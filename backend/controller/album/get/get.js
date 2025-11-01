import prisma from "../../../prismaClient.js";

export async function get(req,res){
        try{
        const getAlbum = await prisma.album.findMany()
        res.status(201).json({ data: getAlbum });
    }catch(e){
        console.error(e);
        res.status(500).json({ error: "failed to get album" });
    }

}

export async function getBy(req, res) {
    try {
        const { userId } = req.params;

        const getAlbum = await prisma.album.findMany({
        where: { userId: userId },
        });

        res.status(200).json({ data: getAlbum });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to get albums by userId" });
    }
}