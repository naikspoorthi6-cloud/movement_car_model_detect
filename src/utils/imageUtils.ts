/**
 * Converts a File or Blob into a base64 string
 */
export async function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Optimizes an image data URL (resizes if exceeding max dimension) to ensure
 * fast and reliable transmission without sacrificing vision fidelity.
 */
export async function optimizeImageData(
  dataUrl: string,
  maxDimension = 1024
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve({
          base64: dataUrl,
          mimeType: 'image/jpeg',
        });
      }

      ctx.drawImage(img, 0, 0, width, height);
      const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({
        base64: optimizedDataUrl,
        mimeType: 'image/jpeg',
      });
    };
    img.onerror = () => reject(new Error('Failed to load image for processing'));
    img.src = dataUrl;
  });
}

/**
 * Fetches an external sample image URL and converts to base64
 */
export async function urlToBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load sample image');
  }
  const blob = await response.blob();
  const rawBase64 = await fileToBase64(blob);
  return optimizeImageData(rawBase64);
}
