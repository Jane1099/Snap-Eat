export async function preprocessMealPhoto(source: File): Promise<{ file: File; dataUrl: string }> {
  const isHeic = /\.(heic|heif)$/i.test(source.name) || /^image\/(heic|heif)(-sequence)?$/i.test(source.type);
  if (!source.type.startsWith('image/') && !isHeic) throw new Error('Select an image file.');
  if (source.size > 20 * 1024 * 1024) throw new Error('Choose a photo smaller than 20 MB.');

  const load = async (blob: Blob): Promise<HTMLImageElement> => {
    const url = URL.createObjectURL(blob);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('This photo could not be decoded. Try a JPEG or PNG image.'));
        image.src = url;
      });
      return image;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  let image: HTMLImageElement;
  try {
    image = await load(source);
  } catch (error) {
    if (!isHeic) throw error;
    try {
      const { default: heic2any } = await import('heic2any');
      const converted = await heic2any({ blob: source, toType: 'image/png' });
      image = await load(Array.isArray(converted) ? converted[0] : converted);
    } catch {
      throw new Error('This HEIC photo could not be converted. Export it as JPEG or choose another photo.');
    }
  }

  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is unavailable in this browser.');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(result => result ? resolve(result) : reject(new Error('Could not compress this photo.')), 'image/jpeg', 0.8);
  });
  if (blob.size > 5 * 1024 * 1024) throw new Error('The compressed photo is too large. Choose a smaller image.');
  const file = new File([blob], 'meal.jpg', { type: 'image/jpeg' });
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the compressed photo.'));
    reader.readAsDataURL(file);
  });
  return { file, dataUrl };
}
