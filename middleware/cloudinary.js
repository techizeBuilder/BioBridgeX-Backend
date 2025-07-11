
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { v4 as uuidv4 } from 'uuid';
import path from "path";

cloudinary.config({
  cloud_name: "dbkikdoct",
  api_key: "452218513111885",
  api_secret: "ZBuCNB1_ret-rbERBymH1mwJ3KU",
  secure: true,
});

const uploadOncload = async (localfilePath) => {
  try {
    if (!localfilePath) return null;

    const fileName = path.basename(localfilePath); // e.g., "nidhi_resume.pdf"

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(localfilePath, {
      resource_type: 'raw',
      public_id: fileName,
    });

    // Delete the file if it exists
    if (fs.existsSync(localfilePath)) {
      fs.unlinkSync(localfilePath);
    }

    return response;
  } catch (error) {
    // Cleanup if file exists
    if (localfilePath && fs.existsSync(localfilePath)) {
      fs.unlinkSync(localfilePath);
    }
    console.error("Upload error:", error);
    return null;
  }
};

const delteOncloud = async (videoUrl) => {
  try {
    const public_id = cloudinary.url(videoUrl).split('/').pop().split('.')[0];
    const response = await cloudinary.uploader.destroy(public_id, { resource_type: "raw" })
    return response
  } catch (error) {
    return null
  }
}
const uploadRes = async (data, fileName) => {
  const response = await cloudinary.uploader.upload(data, {
    folder: "messagefile",
    public_id: `${uuidv4()}_${fileName}`,
    resource_type: "auto",
  });
  return response
}

export { uploadOncload, delteOncloud, uploadRes };