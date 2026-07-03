import { supabase } from '../config/supabase';

export class R2UploadService {
  static async uploadFile(file: File, folderName: string, userId: string): Promise<string> {
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const filePath = `${folderName}/${userId}/${Date.now()}.${fileExtension}`;

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
