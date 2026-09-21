export async function preparePhoto(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw new Error('Bitte JPG, PNG oder WebP verwenden. HEIC zuerst als JPG exportieren.');
  if (file.size > 12 * 1024 * 1024)
    throw new Error('Das Foto ist grösser als 12 MB. Bitte ein kleineres Bild verwenden.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('Das Bild konnte nicht gelesen werden. Bitte eine andere Datei wählen.');
  }
  try {
    if (bitmap.width < 320 || bitmap.height < 240 || bitmap.width * bitmap.height > 40_000_000)
      throw new Error('Bitte ein Foto zwischen 320 × 240 Pixeln und 40 Megapixeln wählen.');
    const scale = Math.min(1, 1440 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Dieser Browser kann das Bild nicht vorbereiten.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encoding removes EXIF/GPS metadata. The source file remains untouched.
    return canvas.toDataURL('image/jpeg', 0.87);
  } finally {
    bitmap.close();
  }
}
export function downloadFile(content: Blob | string, name: string, mime = 'application/json') {
  const url = URL.createObjectURL(
    content instanceof Blob ? content : new Blob([content], { type: mime }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const safeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'kueche90';
