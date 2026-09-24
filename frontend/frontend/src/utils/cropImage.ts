export async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<File> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => (image.onload = resolve));

  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;

  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 300, 300);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(new File([blob!], 'photo.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg');
  });
}
