import { supabase } from './supabaseClient';

export class R2UploadService {
  /**
   * Uploads a file directly to Cloudflare R2 using a secure presigned upload URL
   * @param file The file object to upload
   * @param folderName The bucket folder path prefix (e.g. 'avatars', 'documents', 'portfolios')
   * @param userId The current user's ID
   */
  static async uploadFile(file: File, folderName: string, userId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filePath = `${folderName}/${userId}/${Date.now()}.${fileExtension}`;

    // Request presigned URL from Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('r2-presign', {
      body: {
        filePath,
        contentType: file.type || 'image/jpeg',
      },
    });

    if (error || !data?.uploadUrl) {
      throw new Error(error?.message || 'Failed to generate R2 upload URL');
    }

    const { uploadUrl, publicUrl } = data;

    // Direct HTTP PUT request to Cloudflare R2 bucket endpoint
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file to R2: ${uploadResponse.statusText}`);
    }

    return publicUrl;
  }
}
