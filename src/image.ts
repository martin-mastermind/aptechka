// Ужимает фото до maxDim по длинной стороне — быстрее грузится в API и меньше весит в базе.
export async function shrinkImage(file: Blob, maxDim = 1536, quality = 0.85): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
    const w = Math.max(1, Math.round(bmp.width * scale));
    const h = Math.max(1, Math.round(bmp.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Не удалось обработать фото'))),
        'image/jpeg',
        quality,
      ),
    );
  } finally {
    bmp.close();
  }
}
