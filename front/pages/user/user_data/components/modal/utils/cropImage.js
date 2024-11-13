// utils/cropImage.js
/**
 * 獲取裁剪後的圖片
 * @param {string} imageSrc - 圖片的資料 URL
 * @param {Object} pixelCrop - 裁剪區域的像素資訊
 * @returns {Promise<string>} - 裁剪後的圖片資料 URL
 */
export default function getCroppedImg(imageSrc, pixelCrop) {
  // 創建一個 canvas 元素
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 創建一個 Image 物件
  const image = new Image()
  image.src = imageSrc

  // 等待圖片載入完成
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  // 設定 canvas 的尺寸為裁剪後的大小
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // 將圖片繪製到 canvas 上，根據裁剪區域進行裁剪
  ctx.drawImage(
    image,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  )

  // 返回一個 Promise，解析為裁剪後的圖片資料 URL
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg')
  })
}
