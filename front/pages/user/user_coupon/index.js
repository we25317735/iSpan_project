import React, { useEffect, useState } from 'react'
import styles from './assets/style/style.module.scss'
import axios from 'axios'

import coupon1 from './assets/img/coupon3.png'
import bg_img from './assets/img/bg-noise.png'

import Header from '@/components/Header'
import List_btn from '../user_components/List_btn' // 換頁按鈕

// 組件
import Coupon_card from './components/coupon_card'
import Loading from '@/components/Loading2'
import Page404 from '@/components/404'

// 取出當前使用者
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

// http://localhost:3000/user/user_coupon

export default function User_coupon() {
  const [coupon_data, setCoupon_data] = useState([]) // 所持有優惠
  const { user } = useContext(AuthContext) // 抓使用者資訊
  // const [isLoading, setIsLoading] = useState(true) // 控制是否顯示 Loading
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      let APIdata = user
      console.log('使用者: ', user[0])
      if (user && user.length > 0 && user[0].permissions == null) {
        APIdata = user[0]
      }

      let api = `http://localhost:3005/api/user/coupon`
      axios.post(api, APIdata).then((res) => {
        // console.log('收到的訊息: ', res.data)
        setCoupon_data(res.data)
        // setIsLoading(false) // 資料抓取完成，關閉 Loading 畫面
      })
    }
  }, [user])

  // loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // if (isLoading) {
  //   return <Loading /> // 如果還在加載，顯示 Loading 畫面
  // }

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  // 優惠券渲染
  const renderContent = () => {
    // 如果沒有資料
    if (coupon_data.length === 0) {
      return <Page404 />
    }

    return coupon_data.map((item, index) => (
      <Coupon_card key={index} data={item} />
    ))
  }

  return (
    <div id={styles['user-page']}>
      {/* 頁面頂部的標題部分 */}
      <Header />

      {/* 會員資料區域 */}
      <div id={styles['user-data']} className="mt-5">
        <h1 className="my-4 mt-5 mt-sm-5" style={{ fontSize: '4rem' }}>
          會員中心
        </h1>
        <div className={styles['tab-box']}>
          {/* 分頁導航按鈕 */}
          <List_btn />

          {/* 主要內容 */}
          <div
            id={`${styles['discounts']}`}
            className="tab-content"
            style={{ backgroundColor: '#fff' }}
          >
            <div
              className={`row mx-0 px-sm-5 px-2 py-4`}
              style={{
                overflow: 'auto',
              }}
            >
              {/* 優惠券渲染 */}
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
