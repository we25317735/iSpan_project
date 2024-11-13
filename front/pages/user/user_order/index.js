import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import styles from './assets/style/style.module.scss'
import bg_img from './assets/img/bg-noise.png'
import Header from '@/components/Header'
import List_btn from '../user_components/List_btn'
import { AuthContext } from '@/context/AuthContext'
import User_order_detailed from './User_order_detailed'
import Page404 from '@/components/404'
import Loading from '@/components/Loading2' // 引入 Loading 組件

export default function User_order() {
  const { user } = useContext(AuthContext)
  const [data, setData] = useState([])
  const [xx, setxx] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  // const [isLoading, setIsLoading] = useState(true) // 資源完全載入前先 loading

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      let APIdata = user
      console.log('google 使用者測試: ', user[0])

      if (user && user.length > 0 && user[0].permissions == null) {
        APIdata = user[0]
      }

      const api = 'http://localhost:3005/user/order'
      axios
        .post(api, APIdata)
        .then((res) => {
          setData(res.data)
          // setIsLoading(false) // 資料抓取完成，關閉 Loading 畫面
        })
        .catch((err) => {
          console.log('發生錯誤', err)
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

  useEffect(() => {
    console.log(data)
  }, [data])

  // if (isLoading) {
  //   return <Loading /> // 如果還在加載，顯示 Loading 畫面
  // }

  // loading 過渡
  // useEffect(() => {
  //   setTimeout(() => {
  //     setLoading(false)
  //   }, 2000)
  // }, [])

  // 切換頁面
  const order_detailed = (e) => {
    setSelectedOrder(e)
    setxx(!xx)
  }

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  return (
    <div
      id={styles['user-page']}
      style={{ backgroundImage: `url(${bg_img.src})` }}
    >
      <Header />
      <div id={styles['user-data']} className="mt-5">
        <h1 className="my-4 mt-5 mt-5" style={{ fontSize: '4rem' }}>
          會員中心
        </h1>
        <div className={styles['tab-box']}>
          <List_btn />
          <div id={`${styles['order-info']}`} className="tab-content">
            <div
              id={styles['Order-detailed']}
              className={`py-3 bg-light`}
              style={{ height: '70vh', overflowY: 'scroll' }}
            >
              {xx ? (
                <User_order_detailed data={selectedOrder} setxx={setxx} />
              ) : data.length > 0 ? (
                data.map((e, index) => (
                  <div
                    className="accordion mx-2 mx-sm-5 my-3"
                    id="accordionExample"
                    key={index}
                  >
                    <div className="accordion-item">
                      <h2
                        className={`${styles['accordion-header']} mb-0`}
                        id={`heading${index}`}
                      >
                        <button
                          className={`${styles['accordion-button']} accordion-button`}
                          data-bs-toggle="collapse"
                          data-bs-target={`#collapse${index}`}
                          aria-expanded="true"
                          aria-controls={`collapse${index}`}
                          style={{ minHeight: '5vh', boxShadow: 'none' }}
                        >
                          <div className="d-md-flex justify-content-between w-100">
                            {/* 訂單編號長度 */}
                            <p
                              className={`${styles['order-ID']} d-none d-lg-block`}
                            >
                              訂單編號: {e.id}
                            </p>
                            <p
                              className={`${styles['order-ID']} d-block d-lg-none`}
                            >
                              訂單編號:{' '}
                              {e.id.length > 10
                                ? `${e.id.slice(0, 10)}...`
                                : e.id}
                            </p>
                            {/* ˇ訂單編號長度 結束*/}
                            <p className={`${styles['order-dare']}  me-5`}>
                              交易日期: {e.create_time.split('T')[0]}
                            </p>
                          </div>
                        </button>
                      </h2>
                      <div
                        id={`collapse${index}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`heading${index}`}
                      >
                        <div
                          className={`${styles['accordion-body']} accordion-body`}
                        >
                          <div className="d-sm-flex  align-items-md-end">
                            <div>
                              <p>
                                購買人: <span class="fw-bold">{e.name}</span>
                              </p>
                              <p>
                                訂單編號: <span class="fw-bold"> {e.id}</span>
                              </p>
                              <p style={{ textWrap: 'nowrap' }}>
                                聯絡電話:{' '}
                                <span class="fw-bold"> {e.phone}</span>
                              </p>
                              <p>
                                交易金額:{' '}
                                <span class="fw-bold">{e.total_amount}</span>
                              </p>
                              <p>
                                付款方式:{' '}
                                <span class="fw-bold">
                                  {e.pay_type === 2 ? 'Line Pay' : '信用卡'}
                                </span>
                              </p>
                            </div>
                            <div className="ms-sm-auto">
                              <button
                                className={`${styles['details-btn']} me-auto `}
                                type="button"
                                onClick={() => order_detailed(e)}
                              >
                                訂單詳情
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <Page404 />
              )}
            </div>

            {/* 切換狀態 */}
            {xx && (
              <a
                href="#"
                onClick={() => setxx(!xx)}
                className="text-center"
                style={{ fontSize: '2rem' }}
              >
                <p className="mt-5 mx-auto">返回交易紀錄</p>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
