import React, { useEffect, useState } from 'react'
import axios from 'axios'
import styles from '@/styles/orderComple.module.scss'
import { Button } from '@mui/material'
import { BsCheckCircle } from 'react-icons/bs'
import { useRouter } from 'next/router'
import Link from 'next/link'
import HotProduct from '@/components/cart/hotproduct/hotproduct'
import Loading from '@/components/Loading'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
export default function OrderDetail() {
  const router = useRouter()
  const { orderId } = router.query
  const [orderData, setOrderData] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (orderId) {
      axios
        .get(`http://localhost:3005/api/cart/searchOrder?orderId=${orderId}`)
        .then((response) => {
          setOrderData(response.data)
        })
        .catch((error) => {
          console.error('Error fetching data:', error)
        })
    }
  }, [orderId])

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  const date = new Date(orderData[0].create_time)
  const lastFourDigits = orderData[0].cardnum.slice(-4)
  const formattedDate = date.toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return (
    <>
      <div className={`g-0 container-fluid ${styles.cart}`}>
        <Header />
        <div className={`row mx-3 justify-content-center ${styles.cartTitle}`}>
          <div
            className={`col-md-5 col-11 d-flex justify-content-between ${styles['cart-header']}`}
          >
            <div
              className={`d-flex align-items-center text-nowrap ${styles['step']} ${styles['h3']}`}
            >
              <span className="me-md-3 me-2">1</span>
              購物車
            </div>
            <div
              className={`d-flex align-items-center text-nowrap ${styles['h3']} ${styles['step']} `}
            >
              <span className="me-md-3 me-2">2</span>
              訂單確認
            </div>
            <div
              className={`d-flex align-items-center text-nowrap ${styles['step']} ${styles['h3']} ${styles['step-active']}`}
            >
              <span className="me-md-3 me-2">3</span>
              訂單完成
            </div>
          </div>
        </div>
        <div className={`${styles['cart-body']}`}>
          <div className="mb-5 mt-md-0 mt-5 text-center ">
            <BsCheckCircle className={`${styles.finishIcon}`} />
          </div>
          <div className={`text-center ${styles.h1} `}>
            本次訂單已完成!
            <div className="mt-5 ms-md-0 ms-3 d-flex justify-content-center">
              <ul
                className={`list-unstyled text-start me-5 ${styles['item1']}`}
              >
                <li>訂單編號：</li>
                <li>訂單日期：</li>
                <li>總金額：</li>
                <li>付款方式：</li>
                <li> {orderData[0].cardnum && <li> 卡號末四碼：</li>}</li>
              </ul>
              <ul className={`list-unstyled text-start ${styles['item2']}`}>
                <li>{orderData[0].id}</li>
                <li>{formattedDate}</li>
                <li>${orderData[0].total_amount}</li>
                <li>{orderData[0].pay_type === 1 ? '信用卡' : 'Line Pay'}</li>
                {orderData[0].cardnum && <li>{lastFourDigits}</li>}
              </ul>
            </div>
            <div className="mb-5 d-flex justify-content-center gap-md-5 gap-3 ">
              <div className="ms-md-0 ms-5">
                <Link href="http://localhost:3000/IGotBrew">
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#2B4f61',
                      color: '#2B4f61',
                      fontSize: '18px',
                      '@media (max-width: 391px)': {
                        transform: 'scale(0.8)',
                        transformOrigin: 'top left',
                        textWrap: 'nowrap',
                        fontSize: '16px',
                      },
                      '&:hover': {
                        borderColor: '#2B4f61',
                        backgroundColor: '#2B4f61',
                        color: 'white',
                      },
                    }}
                  >
                    回首頁
                  </Button>
                </Link>
              </div>
              <div>
                <Link href="http://localhost:3000/user/user_order">
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#2B4f61',
                      color: '#2B4f61',
                      fontSize: '18px',
                      '@media (max-width: 391px)': {
                        transform: 'scale(0.8)',
                        transformOrigin: 'top left',
                        textWrap: 'nowrap',
                        fontSize: '16px',
                      },
                      '&:hover': {
                        borderColor: '#2B4f61',
                        backgroundColor: '#2B4f61',
                        color: 'white',
                      },
                    }}
                  >
                    查看訂單
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className={`${styles.hotproduct}`}>
          <HotProduct />
        </div>
        <Footer />
      </div>
    </>
  )
}
