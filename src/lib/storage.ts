import { supabase } from "./supabase";

export async function uploadProgramImage(file: File, programId: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `programs/${programId}.${ext}`;

  const { data, error } = await supabase.storage
    .from("program-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "image/jpeg" || "image/jpg",
    });

  if (error) throw error;

  const { data: pub } = supabase.storage.from("program-images").getPublicUrl(data.path);
  return { path: data.path, publicUrl: pub.publicUrl };
}
