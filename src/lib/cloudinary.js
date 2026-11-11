// src/lib/cloudinary.js — Unsigned Cloudinary upload helper for images & files (PDF, DOCX, etc.)

export const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'ruyolqz6'

export const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'Img_pdf'

/**
 * Check whether a URL points to an asset hosted on Cloudinary.
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com')
}

/**
 * Upload an image or document file directly to Cloudinary using an unsigned preset.
 * Uses the `/auto/upload` endpoint so images, PDFs, and raw files (DOCX, XLSX, ZIP)
 * are all stored appropriately.
 *
 * @param {File}     file       - File selected by the user
 * @param {string}   folder     - Optional Cloudinary asset_folder path
 * @param {Function} onProgress - (percent: number) => void
 * @returns {Promise<string>}   - Secure HTTPS delivery URL
 */
export function uploadToCloudinary(file, folder = '', onProgress) {
  return new Promise((resolve, reject) => {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      reject(new Error('Cloudinary cloud name or unsigned upload preset is not configured.'))
      return
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

    if (folder) {
      formData.append('asset_folder', folder)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', endpoint)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100))
        onProgress?.(pct)
      }
    }

    xhr.onload = () => {
      let data = null
      try {
        data = JSON.parse(xhr.responseText || '{}')
      } catch {
        data = null
      }

      if (xhr.status >= 200 && xhr.status < 300 && data?.secure_url) {
        onProgress?.(100)
        resolve(data.secure_url)
        return
      }

      const rawMsg = data?.error?.message || `Cloudinary upload failed (HTTP ${xhr.status})`
      if (rawMsg.toLowerCase().includes('whitelisted for unsigned')) {
        reject(
          new Error(
            `Preset "${CLOUDINARY_UPLOAD_PRESET}" must be set to Unsigned in Cloudinary Settings → Upload.`
          )
        )
        return
      }
      reject(new Error(rawMsg))
    }

    xhr.onerror = () => reject(new Error('Network error while uploading file to Cloudinary.'))
    xhr.onabort = () => reject(new Error('Cloudinary upload was cancelled.'))
    xhr.send(formData)
  })
}
