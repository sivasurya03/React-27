const MAX_BYTES = 3 * 1024 * 1024;

/** Crops to a centred square and downsizes, so avatars stay small enough for localStorage. */
export function fileToAvatar(file: File, size = 192): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    if (file.size > MAX_BYTES) return reject(new Error('Image must be smaller than 3 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Image processing is not available in this browser.'));
      }
      const side = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image.'));
    };
    img.src = url;
  });
}

/** Crops to 16:9 and downsizes so a course thumbnail stays small enough for localStorage. */
export function fileToThumbnail(file: File, width = 640, height = 360): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    if (file.size > MAX_BYTES) return reject(new Error('Image must be smaller than 3 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error('Image processing is not available in this browser.'));
      }
      const targetRatio = width / height;
      const sourceRatio = img.width / img.height;
      const sw = sourceRatio > targetRatio ? img.height * targetRatio : img.width;
      const sh = sourceRatio > targetRatio ? img.height : img.width / targetRatio;
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image.'));
    };
    img.src = url;
  });
}
