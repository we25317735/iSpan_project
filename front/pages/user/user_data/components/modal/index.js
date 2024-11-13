import React, { useState, useCallback, useEffect } from 'react'
import styles from './assets/style/style.module.scss'
import { Modal, Button } from 'react-bootstrap'
import Cropper from 'react-easy-crop'
import getCroppedImg from './utils/cropImage' // 更新為你的實際路徑
import axios from 'axios' // 新增 axios 用於圖片上傳
import Swal from 'sweetalert2'

// 改變狀態的 context
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

// 自定義的 Modal 組件，負責圖片裁剪的功能
export default function CustomModal({ show, handleClose }) {
  const { user } = useContext(AuthContext) // 使用者資訊

  const [image, setImage] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [croppedImage, setCroppedImage] = useState(null)

  // 預設初始圖片
  // useEffect(() => {
  //   const defaultImage = 'http://localhost:3005/images/user/zhang_lingfu.jpg'
  //   setImage(defaultImage)
  //   console.log('預設載入的圖片 URL:', defaultImage)
  // }, [])

  // 當裁剪完成時更新裁剪區域像素
  const onCropComplete = useCallback(
    async (croppedArea, croppedAreaPixels) => {
      setCroppedAreaPixels(croppedAreaPixels)
      const croppedImage = await getCroppedImg(image, croppedAreaPixels)
      setCroppedImage(croppedImage)
    },
    [image]
  )

  const FileChange = (e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result)
    }
    reader.readAsDataURL(file)
  }

  // 獲取裁剪後的圖片並轉換為 Blob 格式
  const getCroppedImageBlob = useCallback(async () => {
    if (!croppedAreaPixels || !image) return null
    const croppedImage = await getCroppedImg(image, croppedAreaPixels)
    const blob = await fetch(croppedImage).then((res) => res.blob())
    return blob
  }, [image, croppedAreaPixels])

  // 上傳裁剪後的圖片 + 儲存
  const handleCrop = async () => {
    const blob = await getCroppedImageBlob()
    if (!blob) return

    // console.log("wefvwe ",blob);
    const formData = new FormData()
    formData.append('file', blob, `${user.img}`) //需要改名子

    // console.log('wewefwefw ', `${user.img}`)

    try {
      await axios.post('http://localhost:3005/api/user/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      Swal.fire({
        icon: 'success',
        title: '修改完成',
        showConfirmButton: false,
        timer: 1500,
      })
      window.location.reload()
    } catch (error) {
      console.error('圖片上傳失敗', error)
      alert('圖片上傳失敗')
    }
  }

  useEffect(() => {
    // console.log("使用者資訊 ",user);
  }, [user])

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <h1>大頭貼變更</h1>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-sm-flex" style={{ gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="xx" className={`${styles['file-btn']}`}>
              <p>預 覽</p>
            </label>
            <input
              id="xx"
              type="file"
              className="position-absolute top-0 start-0 opacity-0"
              onChange={FileChange}
            />
            {image && (
              <div
                style={{
                  width: '100%',
                  height: '400px',
                  position: 'relative',
                  marginTop: '20px',
                }}
              >
                <Cropper
                  image={image}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="rect"
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{ containerStyle: { height: '100%', width: '100%' } }}
                />
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            {croppedImage && (
              <div className="w-100 ">
                <div
                  className="mx-sm-auto mt-5"
                  style={{ width: '30%', height: '200px', marginTop: '20px' }}
                >
                  <h3 className="mb-3">裁剪預覽：</h3>
                  <img
                    src={croppedImage}
                    alt="Cropped Image"
                    style={{
                      width: '100%',
                      objectFit: 'cover',
                      borderRadius: '50%',
                    }}
                  />

                  <div
                    className={`${styles['details-btn']} mt-5`}
                    onClick={handleCrop}
                  >
                    <p className="m-0">確認並上傳</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  )
}
