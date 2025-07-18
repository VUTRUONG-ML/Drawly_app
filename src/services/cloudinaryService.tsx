export async function uploadImageToCloudinary(uri: string): Promise<string | null> {
  const cloudName = "dfgmr0yit";
  const uploadPreset = "drawly_upload"; // tên bạn đặt
  const apiUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  const formData = new FormData();
  formData.append("file", {
    uri,
    type: "image/jpeg",
    name: "upload.jpg",
  } as any);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    return data.secure_url || null;
  } catch (error) {
    console.error("Lỗi upload ảnh Cloudinary:", error);
    return null;
  }
}
