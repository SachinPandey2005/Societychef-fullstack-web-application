import supabase from '../api/supabase';

const blobToArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert Blob to ArrayBuffer'));
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader.readAsArrayBuffer(blob);
  });
};

export const uploadFileToStorage = async (
  bucket: string,
  folder: string,
  fileUri: string,
  fileName: string
): Promise<string> => {
  try {
    console.log('[storage.service] Starting file upload:', { bucket, folder, fileName });

    // Ensure session is fresh before upload
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('[storage.service] Active auth session confirmed. Token expires at:', new Date(session.expires_at! * 1000).toISOString());
      } else {
        console.warn('[storage.service] No active Supabase session found before storage upload');
      }
    } catch (sErr) {
      console.warn('[storage.service] Error checking auth session:', sErr);
    }

    const response = await fetch(fileUri);
    const blob = await response.blob();
    const arrayBuffer = await blobToArrayBuffer(blob);
    
    const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, arrayBuffer, {
        contentType: blob.type || 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('[storage.service] Supabase storage upload failed:', error.message);
      throw error;
    }

    // Retrieve the public URL for storage references
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    console.log('[storage.service] File upload successful:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('[storage.service] Upload error details:', error?.message || error);
    throw error;
  }
};

export default uploadFileToStorage;
