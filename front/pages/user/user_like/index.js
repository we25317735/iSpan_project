import React, { useEffect, useState, useRef } from 'react'
import styles from './assets/style/style.module.scss'
import axios from 'axios'

import bg_img from './assets/img/bg-noise.png'

import Header from '@/components/Header'
import List_btn from '../user_components/List_btn'
import Loading from '@/components/Loading2'
import Page404 from '@/components/404'

// 卡片組件
import Article_card from './components/article_card'
import Course_card from './components/course_card'
import Product_card from './components/product_card'

// 取出當前使用者
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export default function User_like() {
  const [classification, setClassification] = useState('product')
  const [data, setData] = useState([]) // API 傳過來的資料
  // const [isLoading, setIsLoading] = useState(true) // 控制是否顯示 Loading
  const [loading, setLoading] = useState(true)

  const contentRef = useRef(null) // 控制滾輪的東西

  const { user } = useContext(AuthContext) // 抓使用者資訊

  useEffect(() => {
    if (user) {
      let APIdata = user
      console.log('使用者: ', user[0])
      if (user && user.length > 0 && user[0].permissions == null) {
        APIdata = user[0]
      }

      let api = `http://localhost:3005/api/user/${classification}_like`
      axios.post(api, APIdata).then((res) => {
        console.log('收到的訊息: ', res.data)
        setData(res.data)
        // setIsLoading(false) // 資料抓取完成，關閉 Loading 畫面
      })
    }

    if (contentRef.current) {
      // 重置滾動條位置到頂部
      contentRef.current.scrollTop = 0
    }
  }, [classification, user])

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

  const cardComponents = {
    product: Product_card, // 商品卡片組件
    course: Course_card, // 課程卡片組件
    article: Article_card, // 文章卡片組件
  }

  const renderContent = () => {
    const CardComponent = cardComponents[classification]

    if (data.length === 0) {
      return <Page404 />
    }

    return data.map((item, index) => <CardComponent key={index} data={item} />)
  }

  return (
    <div
      id={styles['user-page']}
      style={{ backgroundImage: `url(${bg_img.src})` }}
    >
      <Header />

      <div id={styles['user-data']} className="mt-5">
        <h1 className="my-4 mt-5 mt-sm-5" style={{ fontSize: '4rem' }}>
          會員中心
        </h1>
        <div className={styles['tab-box']}>
          <List_btn />

          <div
            id={`${styles['favorite-items']}`}
            className="tab-content position-relative"
          >
            <div
              className={`${styles['bg-color']} row mx-0 px-sm-5 px-2 py-4 `}
              style={{
                height: '70vh',
                overflow: 'auto',
              }}
              ref={contentRef}
            >
              {renderContent()}
            </div>

            {/* 分類標籤 */}
            <div
              id={`${styles['classification_tags']}`}
              className="text-center"
            >
              <p
                onClick={() => setClassification('product')}
                className={
                  classification === 'product' ? styles['active-tag'] : ''
                }
                style={{ fontSize: '2rem', cursor: 'pointer' }}
              >
                商品
              </p>
              <p
                onClick={() => setClassification('course')}
                className={
                  classification === 'course' ? styles['active-tag'] : ''
                }
                style={{ fontSize: '2rem', cursor: 'pointer' }}
              >
                課程
              </p>
              <p
                onClick={() => setClassification('article')}
                className={
                  classification === 'article' ? styles['active-tag'] : ''
                }
                style={{ fontSize: '2rem', cursor: 'pointer' }}
              >
                文章
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
