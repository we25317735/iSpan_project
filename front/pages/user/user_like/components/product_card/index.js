import React, { useState, useContext } from 'react'
import styles from './assets/style/style.module.scss'
import axios from 'axios'
import { FaHeart } from 'react-icons/fa'
import { CiHeart } from 'react-icons/ci'
import { useRouter } from 'next/router'

import Loading from '@/components/Loading2'

// 取出當前使用者
import { AuthContext } from '@/context/AuthContext'

/* 有按讚道重複的, 刪除再點擊時 會把多餘的刪掉 */
export default function ProductCard(props) {
  const product = props.data // 取得商品數據
  const [heart, setHeart] = useState(true) // 心心點擊狀態
  const [loading, setLoading] = useState(false) // 點擊直到切換的過渡

  const { user } = useContext(AuthContext)

  const router = useRouter() // 獲取路由資訊

  // 心心圖示點擊事件
  const icon_click = (e, action) => {
    e.stopPropagation() // 防止事件冒泡
    e.preventDefault() // 防止預設行為
    setHeart(!heart) // 切換心心狀態

    const data = {
      // 前面是一般用戶, 後面是 google用戶
      id: user.id || user[0].id,
      name: user.name || user[0].name,
      product_id: product.id,
    }

    // console.log('測試 google 帳戶: ', user[0].name) // 有抓到

    // API URL
    const api = `http://localhost:3005/api/user/product_like/${action}`

    // 根據 action 的值決定使刪除還是新增
    // 因為 a 標籤被 e.preventDefault() ,所以要離開頁面才會決定東西去留
    const request =
      action === 'create'
        ? axios.post(api, data)
        : action === 'delete'
        ? axios.delete(api, { data })
        : Promise.reject(new Error('Invalid action'))

    request
      .then((res) => {
        console.log(res.data)
      })
      .catch((error) => {
        console.error('更新失敗', error)
      })
  }

  // 商品卡片點擊事件，導航到指定路徑
  const CardClick = async () => {
    setLoading(true)
    await router.push(`/product/${product.id}`)
    setLoading(false)
  }

  return (
    <>
      <div className="col-12 col-sm-4 col-md-3" key={product.id}>
        <div onClick={CardClick} style={{ cursor: 'pointer' }}>
          <div id={styles['Product-component']} className="mx-2 my-3">
            <div className={styles['img-box']}>
              <img
                src={`http://localhost:3005/images/hello/${product.img}`}
                alt="商品圖片"
              />
            </div>
            <p className={styles['content']}>{product.name}</p>
            <div className={styles['other']}>
              <p>
                $ <span>{product.price}</span>
              </p>
              <div className={styles['icon']}>
                {/* 根據心心狀態顯示不同的圖示 */}
                <div
                  className={`${styles['icon-link']}`}
                  onClick={(e) => icon_click(e, heart ? 'delete' : 'create')}
                >
                  {heart ? (
                    <FaHeart size={20} color="red" />
                  ) : (
                    <CiHeart size={23} color="red" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {loading && (
        <div style={{ width: '150px' }}>
          <Loading />
        </div>
      )}
    </>
  )
}
