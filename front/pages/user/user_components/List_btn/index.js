import React, { useState, useEffect } from 'react'
import styles from './assets/style/style.module.scss'
import { useRouter } from 'next/router'
import Loading from '@/components/Loading2'

// 使用者畫面 頁籤
export default function List_btn() {
  const [list] = useState([
    { title: '基本資料', data_target: 'user_data' }, // 基本資料分頁
    { title: '訂單查詢', data_target: 'user_order' }, // 訂單查詢分頁
    { title: '按讚好物', data_target: 'user_like' }, // 按讚好物分頁
    { title: '優惠專區', data_target: 'user_coupon' }, // 優惠專區分頁
  ])

  const router = useRouter()
  const [activeTab, setActiveTab] = useState('')
  const [loading, setLoading] = useState(false) // 點擊直到切換的過渡

  // 初始化時設置 activeTab 為當前路由
  useEffect(() => {
    const path = router.pathname.split('/').pop()
    setActiveTab(path)
  }, [router.pathname])

  // 處理分頁切換
  const TabChange = async (data_target) => {
    setLoading(true) // 開始載入動畫
    setActiveTab(data_target) // 設置 activeTab 為點擊的分頁
    await router.push(`/user/${data_target}`, undefined, { shallow: true }) // 更新URL
    setLoading(false) // 結束載入動畫
  }

  return (
    <>
      {loading && (
        <div style={{ width: '150px' }}>
          <Loading />
        </div>
      )}
      {/* 顯示 Loading 組件 */}
      {/* 分頁導航按鈕 */}
      <ul
        className={`nav ${styles['nav']} nav-tabs ${styles['nav-tabs']} mb-5 mb-sm-0`}
        style={{ cursor: 'pointer' }}
      >
        {list.map((e, index) => (
          <li
            key={index}
            className={`${styles['nav-item']} nav-item`}
            onClick={() => TabChange(e.data_target)}
          >
            <a
              className={`nav-link ${
                activeTab === e.data_target ? `${styles.active} active` : ''
              } px-sm-5 py-sm-3`}
            >
              {e.title}
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
