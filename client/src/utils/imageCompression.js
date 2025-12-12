import imageCompression from 'browser-image-compression';

/**
 * Compress and resize images before upload
 * Reduces bandwidth and server storage while maintaining quality
 *
 * @param {File} file - Original image file
 * @param {Object} options - Compression options
 * @returns {Promise<File>} Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  const defaultOptions = {
    maxSizeMB: 1, // Maximum file size in MB
    maxWidthOrHeight: 1920, // Max dimension (width or height)
    useWebWorker: true, // Use web worker for better performance
    quality: 0.8, // Quality from 0 to 1
    ...options,
  };

  try {
    // Skip compression for very small files (<100KB)
    if (file.size < 100 * 1024) {
      return file;
    }

    const compressedFile = await imageCompression(file, defaultOptions);

    // Log compression results in development
    if (import.meta.env.DEV) {
      console.log(
        `Image compressed: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(
          compressedFile.size /
          1024 /
          1024
        ).toFixed(2)}MB (${Math.round(
          (1 - compressedFile.size / file.size) * 100
        )}% reduction)`
      );
    }

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Compress multiple images in parallel
 *
 * @param {FileList|File[]} files - Array of image files
 * @param {Object} options - Compression options
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<File[]>} Array of compressed files
 */
export const compressImages = async (
  files,
  options = {},
  onProgress = null
) => {
  const fileArray = Array.from(files);
  const compressed = [];

  for (let i = 0; i < fileArray.length; i++) {
    const file = fileArray[i];

    // Only compress image files
    if (file.type.startsWith('image/')) {
      const compressedFile = await compressImage(file, options);
      compressed.push(compressedFile);
    } else {
      compressed.push(file);
    }

    if (onProgress) {
      onProgress(i + 1, fileArray.length);
    }
  }

  return compressed;
};
