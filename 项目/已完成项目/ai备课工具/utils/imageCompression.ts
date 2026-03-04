/**
 * 将图片压缩到指定宽度
 * @param imageUrl - 原始图片URL
 * @param targetWidth - 目标宽度（默认1024）
 * @param quality - 压缩质量（0-1，默认0.9）
 * @returns 压缩后的Blob对象
 */
export const compressImageToWidth = async (
  imageUrl: string,
  targetWidth: number = 1024,
  quality: number = 0.9
): Promise<Blob> => {
  console.log('=== 开始压缩图片 ===');
  console.log('原始图片URL:', imageUrl);
  console.log('目标宽度:', targetWidth);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 允许跨域

    img.onload = () => {
      console.log('原始图片尺寸:', img.width, 'x', img.height);

      // 计算压缩后的尺寸
      let width = img.width;
      let height = img.height;

      if (width > targetWidth) {
        // 需要压缩
        const ratio = targetWidth / width;
        width = targetWidth;
        height = Math.round(height * ratio);
      }

      console.log('压缩后尺寸:', width, 'x', height);

      // 创建canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('无法创建Canvas上下文'));
        return;
      }

      // 绘制压缩后的图片
      ctx.drawImage(img, 0, 0, width, height);

      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('图片压缩失败'));
            return;
          }

          console.log('压缩完成，文件大小:', (blob.size / 1024).toFixed(2), 'KB');
          resolve(blob);
        },
        'image/png',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('图片加载失败'));
    };

    img.src = imageUrl;
  });
};
