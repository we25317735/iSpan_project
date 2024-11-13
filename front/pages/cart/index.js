import React, { useState, useEffect, useContext } from 'react'
import axios from 'axios'
import styles from '@/styles/cart.module.scss'
import HotProduct from '@/components/cart/hotproduct/hotproduct'
import CartList from '@/components/cart/cartlist/productcartlist/productcartlist'
import CartList2 from '@/components/cart/cartlist/coursecartlist/coursecartlist'
import CartListPhone from '@/components/cart/cartlist/productcartlist/productcartlist-phone'
import CartList2Phone from '@/components/cart/cartlist/coursecartlist/coursecartlist-phone'
import { useCart } from '@/hooks/use-cart'
import { Modal } from 'react-bootstrap'
import { AuthContext } from '@/context/AuthContext'
import Radio from '@mui/material/Radio'
import { useRouter } from 'next/router'
import Swal from 'sweetalert2'
import { Button } from '@mui/material'
import IconButton from '@mui/material/IconButton'
import SearchIcon from '@mui/icons-material/Search'
import FormControlLabel from '@mui/material/FormControlLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Loading from '@/components/Loading'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import couponImg from '@/public/images/cart/couponimg.png'
import couponImg2 from '@/public/images/cart/couponImgyellow.png'
import Image from 'next/image'
import { RiCoupon2Line } from 'react-icons/ri'
export default function Cart() {
  const freight = 60
  const [selectedCoupon, setSelectedCoupon] = useState('')
  const getUrl = 'http://localhost:3005/api/cart/selectcoupon'
  const [show, setShow] = useState(false)
  const router = useRouter()

  const {
    totalPrice,
    totalQty,
    totalPrice1,
    totalQty1,
    cartItems,
    cartItems1,
  } = useCart()
  const doAccess = () => {
    setIsAllowed(true)
    router.push('/cart/order')
  }
  const hasProducts = cartItems.length > 0
  const hasCourses = cartItems1.length > 0
  const { user, setIsAllowed } = useContext(AuthContext)
  const [couponData, setCouponData] = useState([])
  const [discountAmount, setDiscountAmount] = useState(0)
  const [netTotal, setNetTotal] = useState(totalPrice + totalPrice1)
  const [isCartEmpty, setIsCartEmpty] = useState(false)
  const [loading, setLoading] = useState(true)
  const doClose = () => {
    setShow(false)
    setSearchTerm('')
    localStorage.removeItem('selectedCouponObj')
  }
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCoupons = Array.isArray(couponData)
    ? couponData.filter((coupon) => coupon.coupon_name.includes(searchTerm))
    : []
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])
  const doCheckCartItems = () => {
    if (cartItems.length === 0 && cartItems1.length === 0) {
      setIsCartEmpty(true)
      Swal.fire({
        icon: 'error',
        title: '您的購物車為空',
        showConfirmButton: false,
        timer: 1000,
      })

      router.push('/product')
      return
    }

    if (!user) {
      Swal.fire({
        icon: 'warning',
        title: '請先登入',
        showConfirmButton: false,
        timer: 1000,
      })
      router.push('/login')
      return
    }
    doAccess()
  }

  const doCouponChange = (event) => {
    const selectedCouponName = event.target.value
    setSelectedCoupon(selectedCouponName)

    const selectedCouponObj = couponData.find(
      (coupon) => coupon.coupon_name === selectedCouponName
    )

    if (selectedCouponObj) {
      const discount = calculateDiscount(
        totalPrice + totalPrice1,
        selectedCouponObj
      )
      setDiscountAmount(discount)
      setNetTotal(totalPrice + totalPrice1 - discount)

      localStorage.setItem(
        'selectedCouponObj',
        JSON.stringify({ ...selectedCouponObj, discountAmount: discount })
      )
    } else {
      setDiscountAmount(0)
      setNetTotal(totalPrice + totalPrice1)
    }

    setShow(false)
  }

  useEffect(() => {
    console.log(user)
    if (user && user.id) {
      const fetchCoupons = async () => {
        try {
          const response = await axios.post(getUrl, { user })
          setCouponData(response.data)
        } catch (error) {
          console.error('獲取優惠券資料錯誤:', error)
        }
      }
      fetchCoupons()
    }
  }, [user])
  const doShow = () => {
    setSelectedCoupon('')
    setShow(true)
  }

  const doSelectChange = (event) => {
    const selectedCouponName = event.target.value
    localStorage.removeItem('selectedCouponObj')
    const selectedCouponObj = couponData.find(
      (coupon) => coupon.coupon_name === selectedCouponName
    )

    if (selectedCouponObj) {
      const discount = calculateDiscount(
        totalPrice + totalPrice1,
        selectedCouponObj
      )
      setDiscountAmount(discount)
      setNetTotal(totalPrice + totalPrice1 - discount)
      localStorage.setItem(
        'selectedCouponObj',
        JSON.stringify({ ...selectedCouponObj, discountAmount: discount })
      )
    } else {
      setDiscountAmount(0)
      setNetTotal(totalPrice + totalPrice1)
    }
    setSelectedCoupon(selectedCouponName)
  }

  const calculateDiscount = (price, coupon) => {
    let discount = 0
    if (coupon.coupon_type === 'amount') {
      discount = parseFloat(coupon.coupon_value)
    } else if (coupon.coupon_type === 'percent') {
      discount = Math.round(price * (1 - coupon.coupon_value))
    }
    return discount
  }

  useEffect(() => {
    if (couponData && couponData.length > 0) {
      const selectedCouponObj = couponData.find(
        (coupon) => coupon.coupon_name === selectedCoupon
      )
      if (selectedCouponObj) {
        const discount = calculateDiscount(
          totalPrice + totalPrice1,
          selectedCouponObj
        )
        setDiscountAmount(discount)
        setNetTotal(totalPrice + totalPrice1 - discount)
      } else {
        setDiscountAmount(0)
        setNetTotal(totalPrice + totalPrice1)
      }
    } else {
      setDiscountAmount(0)
      setNetTotal(totalPrice + totalPrice1)
    }
  }, [totalPrice, totalPrice1, couponData, selectedCoupon])
  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }
  const couponNames =
    couponData && couponData.length > 0
      ? couponData.map((coupon) => coupon.coupon_name)
      : []

  if (isCartEmpty) {
    return null
  }

  return (
    <>
      <Modal className={`${styles.h4}`} show={show} onHide={doClose} centered>
        <Modal.Header closeButton>
          <Modal.Title className={`${styles.h2}`}>選擇優惠券</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex justify-content-center my-2 ms-4">
            <input
              type="text"
              className="me-3 ps-2"
              placeholder="請輸入優惠券名稱"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <IconButton aria-label="search" size="large">
              <SearchIcon fontSize="large" />
            </IconButton>
          </div>
          <RadioGroup
            aria-label="couponselect"
            name="couponselect"
            value={selectedCoupon}
            onChange={doCouponChange}
          >
            {filteredCoupons && filteredCoupons.length > 0 ? (
              filteredCoupons.map((v) => (
                <div
                  key={v.id}
                  className={`d-flex mt-3 mb-4 gap-3 ${styles.couponarea}`}
                >
                  <div className={`col-3 ${styles.couponImg}`}>
                    <Image
                      className="object-fit-cover h-100 w-100"
                      src={v.coupon_type === 'percent' ? couponImg : couponImg2}
                      alt=""
                    />
                  </div>
                  <div className="col-6">
                    <div className={`${styles.h3}`}>{v.coupon_name}</div>
                    <div className="d-flex">
                      <div className={`mt-3 ${styles.h5}`}>x{v.quantity}</div>
                    </div>
                    <div className={`mt-4 ${styles.couponBottom} ${styles.p}`}>
                      有效日期:2024年12月31日截止
                    </div>
                  </div>
                  <div className="col-auto my-auto">
                    <FormControlLabel
                      value={v.coupon_name}
                      control={
                        <Radio
                          sx={{
                            color: '#2B4f61',
                            '&.Mui-checked': { color: '#2b4f61' },
                          }}
                        />
                      }
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: 28,
                        },
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div>目前沒有符合條件的優惠券</div>
            )}
          </RadioGroup>
        </Modal.Body>
      </Modal>
      <div className={`container-fluid g-0 ${styles['carts']}`}>
        <Header />
        <div className={`mx-3 row justify-content-center ${styles.cart} `}>
          <div
            className={`col-md-5 col-11 d-flex justify-content-between ${styles['cart-header']}`}
          >
            <div
              className={`d-flex align-items-center text-nowrap ${styles['step']} ${styles['step-active']} ${styles['h3']}`}
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
              className={`d-flex align-items-center text-nowrap ${styles['step']} ${styles['h3']}`}
            >
              <span className="me-md-3 me-2">3</span>
              訂單完成
            </div>
          </div>
        </div>

        <div className={`row g-0 gap-5 ${styles['cart-main']}`}>
          <div className={` col-8  d-none d-md-block ${styles['main-left']}`}>
            {hasProducts && <CartList />}
            {hasCourses && <CartList2 />}
            {!hasProducts && !hasCourses && (
              <div className={`text-center py-5 ${styles.h2} `}>購物車為空</div>
            )}
          </div>
          <div className={` col-12 d-md-none d-block `}>
            {hasProducts && <CartListPhone />}
            {hasCourses && <CartList2Phone />}
            {!hasProducts && !hasCourses && (
              <div className={`text-center py-5 ${styles.h2} `}>購物車為空</div>
            )}
          </div>
          <div
            className={`ms-md-0 ms-2 col-md-4 col-12 row ${styles['main-right']}`}
          >
            <div
              className={`container d-flex align-items-center ${styles['main-right-title']}`}
            >
              訂單詳情
            </div>
            <div className="ms-md-0 ms-2 ps-0 mt-3 mb-3">
              <div className={` d-flex align-items-center `}>
                <div className={`ms-2 col-auto d-md-flex d-none `}>
                  <div className={`d-flex me-3  my-auto ${styles.h4}`}>
                    <RiCoupon2Line fontSize={30} className=" mb-1" />：
                    <div className="mt-1 me-3">{selectedCoupon}</div>
                  </div>
                  <Button
                    variant="outlined"
                    onClick={doShow}
                    sx={{
                      borderColor: '#2B4f61',
                      color: '#2B4f61',
                      fontSize: '16px',

                      '&:hover': {
                        borderColor: '#2B4f61',
                        backgroundColor: '#2B4f61',
                        color: 'white',
                      },
                      '@media (max-width: 391px)': {
                        transform: 'scale(0.7)',
                        transformOrigin: 'top left',
                        textWrap: 'nowrap',
                      },
                    }}
                  >
                    {selectedCoupon.length != 0 ? '重新選擇' : '選擇優惠券'}
                  </Button>
                </div>
                <div className="ms-2 col-auto d-md-none d-flex ">
                  <RiCoupon2Line fontSize={30} />
                  <select
                    className={`form-select ms-3 ${styles['h5']}`}
                    onChange={doSelectChange}
                    value={selectedCoupon}
                  >
                    <option value="">請選擇優惠券</option>
                    {couponNames.map((name, index) => (
                      <option key={index} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div
              className={`pt-2 d-flex justify-content-between ${styles['main-right-body']}`}
            >
              <h3>總金額</h3>
              <h3>${totalPrice + totalPrice1}</h3>
            </div>
            {totalPrice + totalPrice1 > 0 && (
              <div
                className={`pt-2 d-flex justify-content-between ${styles['main-right-body']}`}
              >
                <h3>運費</h3>
                <h3>${freight}</h3>
              </div>
            )}

            {discountAmount > 0 && (
              <div
                className={`pt-2 d-flex justify-content-between ${styles['main-right-body']}`}
              >
                <h3>優惠券折扣</h3>
                <h3>{`-$${discountAmount}`}</h3>
              </div>
            )}
            <div
              className={`pt-2 d-flex justify-content-between ${styles['right-bottom-bottom']}`}
            >
              <h2>
                實付金額<span>(共{totalQty + totalQty1}件商品)</span>
              </h2>
              <p>${totalPrice + totalPrice1 > 0 ? netTotal + freight : 0}</p>
            </div>

            <div className={`d-flex justify-content-center mt-4 ms-md-0 ms-3`}>
              <Button
                variant="contained"
                type="submit"
                onClick={doCheckCartItems}
                sx={{
                  borderColor: '#2B4f61',
                  color: 'white',
                  fontSize: '18px',
                  borderRadius: '7px',
                  backgroundColor: '#2B4f61',
                  '@media (max-width: 391px)': {
                    transform: 'scale(0.9)',
                    transformOrigin: 'top left',
                  },
                  '&:hover': {
                    borderColor: '#e4960e',
                    backgroundColor: '#e4960e',
                    color: 'black',
                  },
                }}
              >
                下訂單
              </Button>
            </div>
          </div>
        </div>
        <div className={`${styles.hotproduct}`}>
          <HotProduct />
        </div>
        <div className="mt-md-0 mt-5">
          <Footer />
        </div>
      </div>
    </>
  )
}
