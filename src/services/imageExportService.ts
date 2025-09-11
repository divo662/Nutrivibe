import { toPng } from 'html-to-image';
import { supabase } from '@/integrations/supabase/client';

export type ExportOptions = {
  fileName?: string;
  quality?: number; // 0..1
  pixelRatio?: number; // scale factor for crisp export
  backgroundColor?: string;
};

function dataUrlToBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new Blob([u8arr], { type: mime });
}

export class ImageExportService {
  static async nodeToPng(node: HTMLElement, options?: ExportOptions): Promise<string> {
    const pixelRatio = options?.pixelRatio ?? 2;
    const quality = options?.quality ?? 1;
    const backgroundColor = options?.backgroundColor ?? '#fff';

    return await toPng(node, { pixelRatio, quality, backgroundColor, cacheBust: true });
  }

  static triggerDownload(dataUrl: string, fileName = 'recipe.png') {
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataUrl;
    link.click();
  }

  static async uploadToSupabase(userId: string, id: string, dataUrl: string, bucket: 'recipe-images' | 'meal-plan-images' = 'recipe-images'): Promise<string | null> {
    try {
      const blob = dataUrlToBlob(dataUrl);
      const path = `${userId}/${id}.png`;
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: 'image/png', upsert: true });
      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from(bucket)
        .getPublicUrl(data?.path || path);
      return publicUrl?.publicUrl ?? null;
    } catch (err) {
      console.error('Failed to upload recipe image:', err);
      return null;
    }
  }
}


