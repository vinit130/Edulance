export const CLOUDINARY_CLOUD_NAME = "dlzppauym";
export const CLOUDINARY_UPLOAD_PRESET = "d61ecgbw";

export async function uploadToCloudinary(file) {

  const form = new FormData();

  form.append("file", {
    uri: file.uri,
    type: file.mimeType || file.type,
    name: file.fileName || file.name || "upload",
  });

  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  // 👇 THIS PART
  const endpoint =
    file.mimeType === "application/pdf"
      ? "raw"
      : "auto";

  // 👇 THIS PART
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${endpoint}/upload`;

  console.log("Uploading to:", url);

  const response = await fetch(url, {
    method: "POST",
    body: form,
  });

  const result = await response.json();

  console.log("Cloudinary:", result);

  if (result.error) {
    throw new Error(result.error.message);
  }

  // 👇 THIS PART
  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
  };
}