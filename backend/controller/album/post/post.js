import prisma from "../../../prismaClient.js";

export async function post(req,res){
    try{

        const {dominantEmotion,picUrl,userId,createdBy,albumId}  = req.body;
        if(!dominantEmotion || !picUrl || !userId || !createdBy ||!albumId){
            return res.status(401).json({ error: "Missing required field" });
        }
        const album = await prisma.album.create({
            data: {
                dominantEmotion:dominantEmotion,
                picUrl:picUrl,
                userId:userId,
                createdBy:createdBy,
                albumId:albumId
            }
        })
        res.status(201).json({ data: album });
    }catch(e){
        console.error(e);
        res.status(500).json({ error: "failed to post album" });
    }
}