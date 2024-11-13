import React, { useState, useEffect } from 'react'
import styles from './assets/style/style.module.scss'
import Card from './components/card'
import Header from '@/components/Header'

// 背景波浪
import bg_1 from './assets/img/bg-4.png'
import bg_2 from './assets/img/bg-3.png'
import bg_3 from './assets/img/bg-2.png'
import bg_4 from './assets/img/bg-1.png'
import bg_fidex from './assets/img/bg-fidex.png'
import xxx from './assets/img/xxx.png'

import Loading from '@/components/Loading2'

export default function Login() {
  const [isLoading, setIsLoading] = useState(true)

  // 在把圖片等資源載入前, 先 loading
  useEffect(() => {
    // 模擬圖片與資源載入
    const loadResources = () => {
      const images = [
        xxx.src,
        bg_fidex.src,
        bg_1.src,
        bg_2.src,
        bg_3.src,
        bg_4.src,
      ]
      const promises = images.map(
        (img) =>
          new Promise((resolve) => {
            const image = new Image()
            image.src = img
            image.onload = resolve
          })
      )
      return Promise.all(promises)
    }

    loadResources().then(() => {
      setIsLoading(false)
    })
  }, [])

  if (isLoading) {
    return <Loading /> // 載入時顯示 Loading
  }

  return (
    <div id={`${styles['login']}`}>
      <div>
        <Header />
      </div>
      <img
        src={xxx.src}
        className={`${styles['bg-img']}  ${styles['xxx']} d-none d-sm-block`}
      />

      {/* 上下移動的圖片 */}
      <img
        src={bg_fidex.src}
        className={`${styles['bg-img']}  ${styles['bg-fidex']} d-none d-sm-block`}
      />

      {/* 背景圖片 */}
      <img
        src={bg_3.src}
        className={`${styles['bg-img']}  ${styles['bg-1']} d-none d-sm-block`}
      />
      <img
        src={bg_2.src}
        className={`${styles['bg-img']}  ${styles['bg-2']} d-none d-sm-block`}
      />
      <img
        src={bg_1.src}
        className={`${styles['bg-img']}  ${styles['bg-3']} d-none d-sm-block`}
      />
      <img
        src={bg_4.src}
        className={`${styles['bg-img']}  ${styles['bg-4']} d-none d-sm-block`}
      />

      <div
        className={`container-fluid ${styles.customContainer}`}
        style={{ height: '100vh' }}
      >
        <div className="row h-100">
          <div className="col-12 col-md-4 ms-auto my-auto">
            {/* 卡片開始 */}
            <Card />
          </div>
        </div>
      </div>
    </div>
  )
}
