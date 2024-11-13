import React, { useState, useEffect } from 'react'
import styles from './assets/style/style.module.scss'
import picture from './assets/img/bird.jpg'
import axios from 'axios'
import Loading from '@/components/Loading'
import { useRouter } from 'next/router'

export default function User_order_detailed(props) {
  const [order, setOrder] = useState([])
  const [loading, setLoading] = useState(false) // 點擊直到切換的過渡

  let data = props.data

  const router = useRouter() // 獲取路由資訊

  useEffect(() => {
    const api = 'http://localhost:3005/user/DetailALL'
    axios
      .post(api, data)
      .then((res) => {
        console.log('資料: ', res.data)
        setOrder(res.data)
      })
      .catch((err) => {
        console.log('發生錯誤', err)
      })
  }, [data])

  const Page_Change = async (e) => {
    setLoading(true) // 設定 loading 狀態為 true
    const url = e.product_name
      ? `/product/${e.product_id}`
      : `/course/${e.course_id}`

    await router.push(url) // 使用 router.push 進行頁面跳轉
    setLoading(false) // 跳轉完成後，設定 loading 狀態為 false
  }

  console.log('找到 ', order)

  return (
    <div>
      {order.map((e, index) => (
        <div
          className={`${styles['detailed-item']} mx-sm-5 mx-3 pt-3 py-4`}
          key={index}
        >
          <div
            className="d-flex py-sm-4 px-md-5 px-sm-4 px-2"
            style={{ borderRadius: 14, backgroundColor: '#F7F2ED' }}
          >
            <div className={`${styles['img-box']} `}>
              {/* 圖片渲染 */}
              {e.product_name ? (
                <img
                  src={`http://localhost:3005/images/hello/${e.product_img}`}
                  alt=""
                />
              ) : (
                <img
                  src={`http://localhost:3005/images/course/${e.course_img}`}
                  alt=""
                />
              )}
            </div>
            <div className={`${styles['data-box']} w-100 ms-md-5 ms-3`}>
              <div>
                <h3 className="pt-3">
                  {e.product_name ? `${e.product_name}` : `${e.course_name}`}
                </h3>
                <div
                  className={`${styles['all-amount']} mt-4 d-none d-sm-block`}
                >
                  <div
                    className="w-100 text-center pt-sm-2 mx-auto"
                    style={{ color: '#F7F2ED' }}
                  >
                    {e.product_name ? `商品` : `課程`}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center align-items-sm-end pb-sm-2 mt-4 mt-sm-0">
                <p
                  className={`${styles['amount']} m-0`}
                  style={{ textWrap: 'nowrap' }}
                >
                  訂單金額: &nbsp;
                  <span>
                    <strong>{e.subtotal}</strong>
                  </span>
                </p>
                <button
                  onClick={() => Page_Change(e)}
                  className={`${styles['details-btn']} ms-5`}
                  style={{
                    cursor: 'pointer',
                  }}
                >
                  再買一次
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ width: '150px' }}>
          <Loading />
        </div>
      )}
    </div>
  )
}
