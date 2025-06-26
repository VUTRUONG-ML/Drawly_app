import { useImage } from '@shopify/react-native-skia';

export function useSkiaImages(images: { id: string; uri: string; x: number; y: number }[]) {
  // Chỉ hỗ trợ tối đa 10 ảnh (hoặc số bạn cần)
  const image0 = useImage(images[0]?.uri ?? '');
  const image1 = useImage(images[1]?.uri ?? '');
  const image2 = useImage(images[2]?.uri ?? '');
  const image3 = useImage(images[3]?.uri ?? '');
  const image4 = useImage(images[4]?.uri ?? '');
  const image5 = useImage(images[5]?.uri ?? '');
  const image6 = useImage(images[6]?.uri ?? '');
  const image7 = useImage(images[7]?.uri ?? '');
  const image8 = useImage(images[8]?.uri ?? '');
  const image9 = useImage(images[9]?.uri ?? '');

  const result = [];

  if (images[0]) result.push({ ...images[0], image: image0 });
  if (images[1]) result.push({ ...images[1], image: image1 });
  if (images[2]) result.push({ ...images[2], image: image2 });
  if (images[3]) result.push({ ...images[3], image: image3 });
  if (images[4]) result.push({ ...images[4], image: image4 });
  if (images[5]) result.push({ ...images[5], image: image5 });
  if (images[6]) result.push({ ...images[6], image: image6 });
  if (images[7]) result.push({ ...images[7], image: image7 });
  if (images[8]) result.push({ ...images[8], image: image8 });
  if (images[9]) result.push({ ...images[9], image: image9 });

  return result;
}
