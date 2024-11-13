import React, { useState, useContext } from 'react'
import styles from './assets/style/style.module.scss'
import axios from 'axios'
import { FaHeart } from 'react-icons/fa'
import { CiHeart } from 'react-icons/ci'
import { useRouter } from 'next/router'

// 取出當前使用者
import { AuthContext } from '@/context/AuthContext'

import Loading from '@/components/Loading2'

/* 有按讚道重複的, 刪除再點擊時 會把多餘的刪掉 */
export default function ArticleCard(props) {
  const article = props.data // 取得商品數據
  const [heart, setHeart] = useState(true) // 心心點擊狀態
  const [loading, setLoading] = useState(false) // 點擊直到切換的過渡

  const { user } = useContext(AuthContext)

  const router = useRouter() // 獲取路由資訊

  // console.log('文章卡片收到: ', article)

  // 心心圖示點擊事件
  const icon_click = (e, action) => {
    e.stopPropagation() // 防止事件冒泡
    e.preventDefault() // 防止預設行為
    setHeart(!heart) // 切換心心狀態

    const data = {
      id: user.id,
      name: user.name,
      article_id: article.id,
    }

    // API URL
    const api = `http://localhost:3005/api/user/article_like/${action}`

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
    await router.push(`/article/${article.id}`)
    setLoading(false)
  }

  return (
    <div className="col-12 col-sm-4 col-md-3" key={article.id}>
      <div onClick={CardClick} style={{ cursor: 'pointer' }}>
        <div id={styles['Product-component']} className="mx-2 my-3">
          <div className={styles['img-box']}>
            <img
              src={`http://localhost:3005/${article.image_url}`}
              alt="商品圖片"
            />
          </div>
          <p className={styles['content']}>{article.title}</p>
          <div className={styles['other']}>
            <p className="ms-3">
              <span>{article.tag2}</span>
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
      {loading && (
        <div style={{ width: '150px', opacity: 0.5 }}>
          <Loading />
        </div>
      )}
    </div>
  )
}
