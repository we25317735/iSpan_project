import { useState, useEffect, useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import Cards from 'react-credit-cards-2'
import styles from '@/styles/order.module.scss'
import Image from 'next/image'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import sevenIcon from '@/public/images/cart/711icon.svg'
import { FaArrowLeft } from 'react-icons/fa6'
import { RiCoupon2Line } from 'react-icons/ri'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { TextField, Button, FormControlLabel } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import axios from 'axios'
import { useRouter } from 'next/router'
import { useCart } from '@/hooks/use-cart'
import 'react-credit-cards-2/dist/es/styles-compiled.css'
import Swal from 'sweetalert2'
import linepayicon from '@/public/images/cart/LINE-Pay(h)_W85_n.png'
import {
  formatCreditCardNumber,
  formatCVC,
  formatExpirationDate,
} from '@/hooks/card'
import { countries, townships, postcodes } from './tw-township'
import { useShip711StoreOpener } from '@/hooks/use-ship-711-store'
import Link from 'next/link'
import Loading from '@/components/Loading'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
let freight = 60

export default function Order() {
  const { user, isAllowed } = useContext(AuthContext)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!isAllowed) {
      router.push('/IGotBrew') // 如果沒有按下按鈕，重定向到首頁
    }
  }, [isAllowed, router])

  const goLinePay = async (orderId) => {
    const swalResult = await Swal.fire({
      icon: 'success',
      title: '即將跳轉至LinePay付款頁面',
      showConfirmButton: false,
      timer: 1500,
    })
    window.location.href = `http://localhost:3005/api/cart/reserve?orderId=${orderId}`
  }

  const doConfirm = async (transactionId) => {
    const res = await axios.get(
      `http://localhost:3005/api/cart/confirm/confirm?transactionId=${transactionId}`
    )

    console.log(res.data)

    if (res.data.data) {
      setResult(res.data.data)
    }
  }

  useEffect(() => {
    if (router.isReady) {
      const { transactionId, orderId } = router.query

      if (!transactionId || !orderId) {
        return
      }

      doConfirm(transactionId)
    }
  }, [router.isReady])

  const [result, setResult] = useState({
    returnCode: '',
    returnMessage: '',
  })
  const { store711, openWindow, closeWindow } = useShip711StoreOpener(
    'http://localhost:3005/api/shipment/711',
    { autoCloseMins: 3 }
  )
  const { totalPrice, totalQty, totalPrice1, totalQty1 } = useCart()

  const postUrl = 'http://localhost:3005/api/cart/create'

  const [products, setProducts] = useState([])
  const [courses, setCourses] = useState([])
  const [selectCoupon, setSelectCoupon] = useState([])
  const [selectedCouponId, setSelectedCouponId] = useState(0)
  const [orderdata, setOrderData] = useState([])
  const [selectedCity, setSelectedCity] = useState(countries[0])
  const [isLinePay, setIsLinePay] = useState(false)
  const [selectedArea, setSelectedArea] = useState(
    townships[countries.indexOf(selectedCity)][0]
  )
  const [product, setProduct] = useState(null)
  const [address, setAddress] = useState('')
  const [state, setState] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    issuer: '',
    focused: '',
    formData: null,
  })
  const [isChecked, setIsChecked] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    ship_method: '',
    bill_type: '',
    status: '',
    total_amount: '',
    user_id: '',
    cardnum: '',
    coupon_id: '',
    pay_type: '',
    address: '',
    store_name: '',
    store_id: '',
    foundation: '',
    productItems: [],
    courseItems: [],
  })

  const postcode =
    postcodes[countries.indexOf(selectedCity)][
      townships[countries.indexOf(selectedCity)].indexOf(selectedArea)
    ]

  const originalTotal = totalPrice + totalPrice1
  const discountAmount =
    selectCoupon.type === 'amount'
      ? selectCoupon.value
      : originalTotal * selectCoupon.value

  const finalAmount = originalTotal - discountAmount
  const totalAmount =
    totalPrice + totalPrice1 - (selectCoupon.discountAmount || 0) + freight
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    if (selectedCity && selectedArea && postcode) {
      const newAddress = `${selectedCity}${selectedArea}`
      setFormData((prevFormData) => ({
        ...prevFormData,
        address: newAddress,
      }))
      setAddress(newAddress)
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        address: '',
      }))
      setAddress('')
    }
  }, [selectedCity, selectedArea, postcode])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedCourses = localStorage.getItem('CourseCart')
        if (storedCourses) {
          setCourses(JSON.parse(storedCourses))
        }
      } catch (error) {
        console.error('Error parsing JSON from localStorage', error)
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const storedSelctCoupon = localStorage.getItem('selectedCouponObj')
        if (storedSelctCoupon) {
          setSelectCoupon(JSON.parse(storedSelctCoupon))
        }
      } catch (error) {
        console.error('Error parsing JSON from localStorage', error)
      }
    }
    if (typeof window !== 'undefined') {
      try {
        const storedProducts = localStorage.getItem('Productcart')
        if (storedProducts) {
          setProducts(JSON.parse(storedProducts))
        }
      } catch (error) {
        console.error('Error parsing JSON from localStorage', error)
      }
    }
    const selectedCouponString = localStorage.getItem('selectedCouponObj')
    if (selectedCouponString) {
      try {
        const selectedCoupon = JSON.parse(selectedCouponString)
        if (selectedCoupon && selectedCoupon.coupon_id) {
          setFormData((prevData) => ({
            ...prevData,
            coupon_id: selectedCoupon.coupon_id,
          }))
        }
      } catch (error) {
        console.error('Error parsing selectedCoupon from localStorage:', error)
      }
    }
    const storedataString = localStorage.getItem('store711')
    if (storedataString) {
      try {
        const storedata = JSON.parse(storedataString)
        if (storedata && storedata.storeid) {
          setFormData((prevData) => ({
            ...prevData,
            store_id: storedata.storeid,
            store_name: storedata.storename,
          }))
        }
      } catch (error) {
        console.error('Error parsing store711 from localStorage:', error)
      }
    }
    const localStorageData = localStorage.getItem('Productcart')
    if (localStorageData) {
      try {
        const parsedData = JSON.parse(localStorageData)
        setFormData((prevData) => ({
          ...prevData,
          productItems: parsedData,
        }))
      } catch (error) {
        console.error('解析 localStorage 資料失敗:', error)
      }
    }
    const localStorageData1 = localStorage.getItem('CourseCart')
    if (localStorageData1) {
      try {
        const parsedData = JSON.parse(localStorageData1)
        setFormData((prevData) => ({
          ...prevData,
          courseItems: parsedData,
        }))
      } catch (error) {
        console.error('解析 localStorage 資料失敗:', error)
      }
    }
  }, [])

  useEffect(() => {
    if (user && user.id) {
      setFormData((prevData) => ({
        ...prevData,
        user_id: user.id,
      }))
    }
  }, [user])

  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      total_amount: totalAmount,
    }))
  }, [totalAmount])

  const doInputChange = (evt) => {
    let { name } = evt.target
    if (evt.target.name === 'number') {
      evt.target.value = formatCreditCardNumber(evt.target.value)
      setFormData({
        ...formData,
        cardnum: evt.target.value.replace(/\D+/g, ''),
      })
    } else if (evt.target.name === 'expiry') {
      evt.target.value = formatExpirationDate(evt.target.value)
    } else if (evt.target.name === 'cvc') {
      evt.target.value = formatCVC(evt.target.value)
    }
    setState((prev) => ({ ...prev, [name]: evt.target.value }))
  }

  const doInputFocus = (evt) => {
    setState((prev) => ({ ...prev, focus: evt.target.name }))
  }

  const doCheckboxChange = () => {
    setIsChecked(!isChecked)
    if (!isChecked) {
      setFormData((prevFormData) => ({
        ...prevFormData,
        name: user.name,
        phone: user.phone,
        email: user.email,
        coupon_id: prevFormData.coupon_id,
        ship_method: prevFormData.ship_method,
        bill_type: prevFormData.bill_type,
        status: prevFormData.status,
        total_amount: prevFormData.total_amount,
        user_id: prevFormData.user_id,
        pay_type: prevFormData.pay_type,
        address: prevFormData.address,
        store_name: prevFormData.store_name,
        store_id: prevFormData.store_id,
        productItems: prevFormData.productItems,
        foundation: prevFormData.foundation,
        courseItems: prevFormData.courseItems,
      }))
    } else {
      setFormData((prevFormData) => ({
        ...prevFormData,
        name: '',
        phone: '',
        email: '',
        coupon_id: prevFormData.coupon_id,
        ship_method: prevFormData.ship_method,
        bill_type: prevFormData.bill_type,
        status: prevFormData.status,
        total_amount: prevFormData.total_amount,
        user_id: prevFormData.user_id,
        pay_type: prevFormData.pay_type,
        address: prevFormData.address,
        store_name: prevFormData.store_name,
        store_id: prevFormData.store_id,
        foundation: prevFormData.foundation,
        productItems: prevFormData.productItems,
        courseItems: prevFormData.courseItems,
      }))
    }
  }

  const doChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const setDeliveryMethod = (value) => {
    setFormData({
      ...formData,
      ship_method: value,
    })
  }

  const setPayType = (value) => {
    setFormData({
      ...formData,
      pay_type: value,
    })
  }

  const setBillType = (value) => {
    setFormData({
      ...formData,
      bill_type: value,
    })
  }

  const doSubmit = async (e) => {
    e.preventDefault()

    const storedataString = localStorage.getItem('store711')
    let storedata = {}
    if (storedataString) {
      try {
        storedata = JSON.parse(storedataString)
      } catch (error) {
        console.error('Error parsing store711 from localStorage:', error)
      }
    }

    const updatedFormData = {
      ...formData,
      store_id: storedata.storeid || formData.store_id,
      store_name: storedata.storename || formData.store_name,
    }

    console.log('FormData being sent to server:', updatedFormData)

    try {
      const response = await axios.post(postUrl, updatedFormData)
      console.log(response)
      try {
        const sendResponse = await axios.post(
          'http://localhost:3005/api/cart/send',
          {
            orderId: response.data.orderId,
            formData: updatedFormData,
          }
        )
        console.log('Send API response:', sendResponse)
      } catch (sendError) {
        console.error('Send API failed:', sendError)
        alert('發送失敗，請重試')
      }
      if (response.data.message === '訂單建立成功2') {
        goLinePay(response.data.orderId)
      } else {
        window.location.href = `/cart/orderComple?orderId=${response.data.orderId}`
      }

      localStorage.removeItem('CourseCart')
      localStorage.removeItem('selectedCouponObj')
      localStorage.removeItem('Productcart')
      localStorage.removeItem('store711')
    } catch (error) {
      console.error('提交失敗', error)
      alert('提交失敗，請重試')
    }
  }

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }
  if (!isAllowed) {
    return null
  }
  return (
    <>
      <div className={`container-fluid ${styles['cart']}`}>
        <Header />

        <div className={`d-md-none d-block mb-4 ${styles['back-icon']}`}>
          <FaArrowLeft />
          <Link
            className=" text-decoration-none"
            href="http://localhost:3000/cart"
          >
            <span className={`ms-2 ${styles.h4}`}>回上一頁</span>
          </Link>
        </div>
        <div className={`row justify-content-center ${styles.cartTitle} `}>
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
              className={`d-flex align-items-center text-nowrap ${styles['h3']} ${styles['step']} ${styles['step-active']}`}
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
        <form action="" method="post" onSubmit={doSubmit}>
          <div className={`row justify-content-center ${styles['cart-main']}`}>
            <div
              className={`col-lg-4 col-md-6 col-sm-8 col-12 border border-secondary bg-white ${styles['cart-left']}`}
            >
              <div className="container">
                <div
                  className={`text-center border-bottom border-secondary py-2 ${styles['h1']}`}
                >
                  訂購資訊
                </div>
                <div className="border-bottom border-secondary">
                  <div className="d-flex justify-content-between mt-3 mb-1">
                    <div className={`mt-2 mt-md-0 ${styles['h2']}`}>
                      收件人資訊
                    </div>
                    <div className={`${styles['h5']}`}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={doCheckboxChange}
                            sx={{
                              '& .MuiSvgIcon-root': { fontSize: 28 },
                              color: '#bdbdbd',
                              '&.Mui-checked': {
                                color: '#2B4f61',
                              },
                            }}
                          />
                        }
                        label="同會員"
                        sx={{
                          margin: 0,

                          '& .MuiFormControlLabel-label': {
                            fontSize: '16px',
                            marginLeft: -1,
                            '@media (max-width: 391px)': {
                              fontSize: '14px',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-4">
                      <TextField
                        id="outlined-basic"
                        label="姓名"
                        name="name"
                        required
                        variant="outlined"
                        onChange={doChange}
                        value={formData.name}
                        placeholder="請輸入姓名"
                        InputProps={{
                          sx: {
                            fontSize: 14,
                            '@media (max-width: 391px)': {
                              fontSize: '12px',
                            },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: 14,
                            '@media (max-width: 391px)': {
                              fontSize: '12px',
                            },
                            '&.MuiInputLabel-shrink': {
                              fontSize: 16,
                              color: '#2B4f61',
                              '@media (max-width: 391px)': {
                                fontSize: '14px',
                              },
                            },
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#2B4f61',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2B4f61',
                            },
                          },
                        }}
                        fullWidth
                      />
                    </div>
                    <div className="mb-4">
                      <TextField
                        id="outlined-basic"
                        label="電話"
                        name="phone"
                        type="phone"
                        required
                        variant="outlined"
                        onChange={doChange}
                        value={formData.phone}
                        placeholder="請輸入電話號碼"
                        InputProps={{
                          sx: {
                            fontSize: 14,
                            '@media (max-width: 391px)': {
                              fontSize: '12px',
                            },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: 14,
                            '@media (max-width: 391px)': {
                              fontSize: '12px',
                            },
                            '&.MuiInputLabel-shrink': {
                              fontSize: 16,
                              color: '#2B4f61',
                              '@media (max-width: 391px)': {
                                fontSize: '14px',
                              },
                            },
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#2B4f61',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2B4f61',
                            },
                          },
                        }}
                        fullWidth
                      />
                    </div>
                    <div className="mb-4">
                      <TextField
                        id="outlined-basic"
                        label="電子信箱"
                        name="email"
                        type="email"
                        required
                        variant="outlined"
                        onChange={doChange}
                        value={formData.email}
                        placeholder="請輸入電子信箱"
                        InputProps={{
                          sx: {
                            fontSize: 14,
                            '@media (max-width: 391px)': {
                              fontSize: '12px',
                            },
                          },
                        }}
                        InputLabelProps={{
                          sx: {
                            fontSize: 14,
                            '@media (max-width: 391px)': {
                              fontSize: '12px',
                            },
                            '&.MuiInputLabel-shrink': {
                              fontSize: 15,
                              color: '#2B4f61',
                              '@media (max-width: 391px)': {
                                fontSize: '12px',
                              },
                            },
                          },
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            '&:hover fieldset': {
                              borderColor: '#2B4f61',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#2B4f61',
                            },
                          },
                        }}
                        fullWidth
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-bottom border-secondary">
                  <div className={`mb-3 ${styles['h2']}`}>運送方式</div>
                  <div className={`d-flex gap-4 mb-4 ${styles['h5']}`}>
                    <label className={`col-auto ${styles['radio-button']}`}>
                      <input
                        className="me-1 form-check-input"
                        name="deliverymethod"
                        type="radio"
                        required
                        value="1"
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                      />
                      <i className="fa-solid fa-truck-fast me-1" />
                      宅配到府
                    </label>
                    <label className={`col-auto ${styles['radio-button']}`}>
                      <input
                        className="me-1 form-check-input"
                        name="deliverymethod"
                        type="radio"
                        value="2"
                        onChange={(e) => setDeliveryMethod(e.target.value)}
                      />
                      <i className="fa-solid fa-shop me-1" />
                      超商取貨
                    </label>
                  </div>
                  <div>
                    {formData.ship_method === '1' && (
                      <div className="row g-0 gap-3">
                        <div className="col-auto g-0 mt-2 mb-2">
                          <FormControl sx={{ m: 0, minWidth: 80 }} size="small">
                            <InputLabel
                              id="demo-simple-select-autowidth-label"
                              shrink={true}
                              required
                              sx={{
                                '&.MuiInputLabel-shrink': {
                                  fontSize: 15,
                                  color: '#2B4f61',
                                },
                              }}
                            >
                              縣市
                            </InputLabel>
                            <Select
                              labelId="demo-simple-select-autowidth-label"
                              id="demo-simple-select-autowidth"
                              label="Age"
                              onChange={(e) => setSelectedCity(e.target.value)}
                              value={selectedCity}
                              sx={{
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#c4c4c4',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#2B4f61',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                  {
                                    borderColor: '#2B4f61',
                                  },
                              }}
                            >
                              {countries.map((city) => (
                                <MenuItem
                                  key={city}
                                  value={city}
                                  sx={{
                                    fontSize: 14,
                                    '@media (max-width: 391px)': {
                                      fontSize: '12px',
                                    },
                                  }}
                                >
                                  {city}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </div>
                        <div className="col-auto mt-2 mb-2">
                          <FormControl sx={{ m: 0, minWidth: 80 }} size="small">
                            <InputLabel
                              id="demo-simple-select-autowidth-label"
                              shrink={true}
                              required
                              sx={{
                                '&.MuiInputLabel-shrink': {
                                  fontSize: 13,
                                  color: '#2B4f61',
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },
                                },
                              }}
                            >
                              地區
                            </InputLabel>
                            <Select
                              labelId="demo-simple-select-autowidth-label"
                              id="demo-simple-select-autowidth"
                              label="Age"
                              onChange={(e) => setSelectedArea(e.target.value)}
                              value={selectedArea}
                              sx={{
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#c4c4c4',
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#2B4f61',
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                  {
                                    borderColor: '#2B4f61',
                                  },
                              }}
                            >
                              {townships[countries.indexOf(selectedCity)].map(
                                (area) => (
                                  <MenuItem
                                    key={area}
                                    value={area}
                                    sx={{ fontSize: 14 }}
                                  >
                                    {area}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </div>
                        <div className="col-2 mt-2 mb-2">
                          <FormControl
                            sx={{
                              m: 0,
                              minWidth: 80,
                              height: '40px',
                              '@media (max-width: 391px)': {
                                height: '36px',
                              },
                            }}
                            size="small"
                          >
                            <TextField
                              id="outlined-basic"
                              label="郵遞區號"
                              name="phone"
                              type="phone"
                              disabled
                              onChange={doChange}
                              variant="outlined"
                              value={postcode}
                              InputProps={{
                                sx: {
                                  fontSize: 14,
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },
                                  height: '100%',
                                },
                              }}
                              InputLabelProps={{
                                sx: {
                                  fontSize: 14,
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },

                                  '&.MuiInputLabel-shrink': {
                                    fontSize: 14,
                                    '@media (max-width: 391px)': {
                                      fontSize: '12px',
                                    },
                                    color: '#2B4f61',
                                  },
                                },
                              }}
                              FormHelperTextProps={{
                                sx: {
                                  fontSize: 14,
                                },
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#2B4f61',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#2B4f61',
                                  },
                                  height: '100%',
                                },
                                height: '40px',
                                '@media (max-width: 391px)': {
                                  height: '36px',
                                },
                              }}
                            />
                          </FormControl>
                        </div>
                        <div className=" mb-4">
                          <TextField
                            id="outlined-basic"
                            label="地址"
                            name="name"
                            required
                            variant="outlined"
                            onChange={(e) => setAddress(e.target.value)}
                            value={address}
                            placeholder="請輸入地址"
                            InputProps={{
                              sx: {
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },
                              },
                            }}
                            InputLabelProps={{
                              sx: {
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },

                                '&.MuiInputLabel-shrink': {
                                  fontSize: 16,
                                  '@media (max-width: 391px)': {
                                    fontSize: '14px',
                                  },
                                  color: '#2B4f61',
                                },
                              },
                            }}
                            FormHelperTextProps={{
                              sx: {
                                fontSize: 12,
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: '#2B4f61',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#2B4f61',
                                },
                              },
                            }}
                            fullWidth
                          />
                        </div>
                      </div>
                    )}
                    {formData.ship_method === '2' && (
                      <div>
                        <div className="d-flex  mb-3">
                          <div className="mb-2">
                            <Image
                              src={sevenIcon}
                              alt=""
                              width={60}
                              height={60}
                            ></Image>
                          </div>
                          <div className="ms-3 mt-3 ">
                            <Button
                              variant="outlined"
                              onClick={() => {
                                openWindow()
                              }}
                              sx={{
                                borderColor: '#2B4f61',
                                color: '#2B4f61',
                                fontSize: '14px',

                                '&:hover': {
                                  borderColor: '#2B4f61',
                                  backgroundColor: '#2B4f61',
                                  color: 'white',
                                },
                                '@media (max-width: 391px)': {
                                  transform: 'scale(0.8)',
                                  transformOrigin: 'top left',
                                  textWrap: 'nowrap',
                                },
                              }}
                            >
                              {store711.storeid ? '重新選擇門市' : '選擇門市'}
                            </Button>

                            <br />
                          </div>
                          <div className={`${styles.seven}`}>
                            {store711.storeid && store711.storename && (
                              <div className={`ms-3 ${styles.h5}`}>
                                門市號碼 :
                                <input
                                  type="text"
                                  name="store_id"
                                  className="ms-md-2"
                                  onChange={doChange}
                                  value={store711.storeid}
                                  disabled
                                />
                                <br />
                                門市名稱 :
                                <input
                                  type="text"
                                  name="store_name"
                                  className="mt-md-3 ms-md-2"
                                  onChange={doChange}
                                  value={store711.storename}
                                  disabled
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-bottom border-secondary">
                  <div className={`mb-3 ${styles['h2']}`}>付款方式</div>
                  <div className={`d-flex gap-4 mb-4 ${styles['h5']}`}>
                    <label className={`col-auto ${styles['radio-button']}`}>
                      <input
                        className="me-1 form-check-input"
                        name="paytype"
                        type="radio"
                        value="1"
                        required
                        onChange={(e) => setPayType(e.target.value)}
                      />
                      <i className="fa-brands fa-cc-visa me-1" />
                      信用卡支付
                    </label>
                    <label className={`col-auto ${styles['radio-button']}`}>
                      <input
                        className="me-1 form-check-input"
                        name="paytype"
                        type="radio"
                        value="2"
                        onChange={(e) => setPayType(e.target.value)}
                      />
                      <i className="fa-brands fa-line me-1 text-success" />
                      電子支付
                    </label>
                  </div>
                  {formData.pay_type === '1' && (
                    <div className="row">
                      <div className="col col-12 d-flex flex-column">
                        <div className="mt-2 mb-4">
                          <TextField
                            id="outlined-basic"
                            label="信用卡卡號"
                            required
                            name="number"
                            variant="outlined"
                            onChange={doInputChange}
                            onFocus={doInputFocus}
                            pattern="[\d| ]{16,22}"
                            placeholder="請輸入卡號"
                            InputProps={{
                              sx: {
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },
                              },
                            }}
                            InputLabelProps={{
                              sx: {
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },

                                '&.MuiInputLabel-shrink': {
                                  fontSize: 15,
                                  '@media (max-width: 391px)': {
                                    fontSize: '13px',
                                  },
                                  color: '#2B4f61',
                                },
                              },
                            }}
                            FormHelperTextProps={{
                              sx: {
                                fontSize: 12,
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: '#2B4f61',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#2B4f61',
                                },
                              },
                            }}
                            fullWidth
                          />
                        </div>
                        <div className="mb-4">
                          <TextField
                            id="outlined-basic"
                            label="持卡人姓名"
                            name="name"
                            required
                            variant="outlined"
                            onChange={doInputChange}
                            onFocus={doInputFocus}
                            placeholder="請輸入持卡人姓名"
                            InputProps={{
                              sx: {
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },
                              },
                            }}
                            InputLabelProps={{
                              sx: {
                                fontSize: 14,
                                '@media (max-width: 391px)': {
                                  fontSize: '12px',
                                },

                                '&.MuiInputLabel-shrink': {
                                  fontSize: 15,
                                  '@media (max-width: 391px)': {
                                    fontSize: '13px',
                                  },
                                  color: '#2B4f61',
                                },
                              },
                            }}
                            FormHelperTextProps={{
                              sx: {
                                fontSize: 12,
                              },
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: '#2B4f61',
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: '#2B4f61',
                                },
                              },
                            }}
                            fullWidth
                          />
                        </div>
                        <div className="d-flex gap-4 mb-4 row">
                          <div className="form-floating col">
                            <TextField
                              id="outlined-basic"
                              label="有效日期"
                              required
                              name="expiry"
                              variant="outlined"
                              fullWidth
                              onChange={doInputChange}
                              onFocus={doInputFocus}
                              placeholder="請輸入有效日期"
                              pattern="\d\d/\d\d"
                              InputProps={{
                                sx: {
                                  fontSize: 14,
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },
                                },
                              }}
                              InputLabelProps={{
                                sx: {
                                  fontSize: 14,
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },

                                  '&.MuiInputLabel-shrink': {
                                    fontSize: 15,
                                    '@media (max-width: 391px)': {
                                      fontSize: '13px',
                                    },
                                    color: '#2B4f61',
                                  },
                                },
                              }}
                              FormHelperTextProps={{
                                sx: {
                                  fontSize: 12,
                                },
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#2B4f61',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#2B4f61',
                                  },
                                },
                              }}
                            />
                          </div>
                          <div className="form-floating col">
                            <TextField
                              id="outlined-basic"
                              label="安全碼"
                              required
                              name="cvc"
                              variant="outlined"
                              fullWidth
                              onChange={doInputChange}
                              onFocus={doInputFocus}
                              placeholder="請輸入安全碼"
                              pattern="\d{3,4}"
                              InputProps={{
                                sx: {
                                  fontSize: 14,
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },
                                },
                              }}
                              InputLabelProps={{
                                sx: {
                                  fontSize: 14,
                                  '@media (max-width: 391px)': {
                                    fontSize: '12px',
                                  },

                                  '&.MuiInputLabel-shrink': {
                                    fontSize: 15,
                                    '@media (max-width: 391px)': {
                                      fontSize: '13px',
                                    },
                                    color: '#2B4f61',
                                  },
                                },
                              }}
                              FormHelperTextProps={{
                                sx: {
                                  fontSize: 12,
                                },
                              }}
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  '&:hover fieldset': {
                                    borderColor: '#2B4f61',
                                  },
                                  '&.Mui-focused fieldset': {
                                    borderColor: '#2B4f61',
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className={`mb-4 d-md-flex d-none`}>
                        <Cards
                          number={state.number}
                          expiry={state.expiry}
                          cvc={state.cvc}
                          name={state.name}
                          focused={state.focus}
                        />
                      </div>
                    </div>
                  )}
                  {formData.pay_type === '2' && (
                    <div className="mb-3">
                      <Image src={linepayicon} alt=""></Image>
                    </div>
                  )}
                </div>
                <div className="mt-3 border-bottom border-secondary">
                  <div className={`mb-3 ${styles['h2']}`}>發票資訊</div>
                  <div className={`d-flex gap-4 mb-4 ${styles['h5']}`}>
                    <label className={`col-auto ${styles['radio-button']}`}>
                      <input
                        required
                        className="me-1 form-check-input"
                        name="invoice"
                        type="radio"
                        value="1"
                        onChange={(e) => setBillType(e.target.value)}
                      />
                      紙本發票
                    </label>
                    <label className={`col-auto ${styles['radio-button']}`}>
                      <input
                        className="me-1 form-check-input"
                        name="invoice"
                        type="radio"
                        value="2"
                        onChange={(e) => setBillType(e.target.value)}
                      />
                      發票捐贈
                    </label>
                  </div>
                  {formData.bill_type === '2' && (
                    <div className="d-block">
                      <div className={`form-check mb-2 ${styles['h5']}`}>
                        <input
                          className="form-check-input"
                          id="foundation1"
                          name="foundation"
                          type="radio"
                          required
                          value={'第一社會福利基金會'}
                          onChange={doChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="foundation1"
                        >
                          第一社會福利基金會
                        </label>
                      </div>
                      <div className={`form-check mb-2 ${styles['h5']}`}>
                        <input
                          className="form-check-input"
                          id="foundation2"
                          name="foundation"
                          type="radio"
                          value={'台北市脊髓損傷社會福利基金會'}
                          onChange={doChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="foundation2"
                        >
                          台北市脊髓損傷社會福利基金會
                        </label>
                      </div>
                      <div className={`form-check mb-2 ${styles['h5']}`}>
                        <input
                          className="form-check-input"
                          id="foundation3"
                          name="foundation"
                          type="radio"
                          value={'財團法人董氏基金會'}
                          onChange={doChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="foundation3"
                        >
                          財團法人董氏基金會
                        </label>
                      </div>
                      <div className={`form-check mb-2 ${styles['h5']}`}>
                        <input
                          className="form-check-input"
                          id="foundation4"
                          name="foundation"
                          type="radio"
                          value={'陽光社會福利基金會'}
                          onChange={doChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="foundation4"
                        >
                          陽光社會福利基金會
                        </label>
                      </div>
                      <div className={`form-check mb-2 ${styles['h5']}`}>
                        <input
                          className="form-check-input"
                          id="foundation5"
                          name="foundation"
                          type="radio"
                          value={'創世基金會'}
                          onChange={doChange}
                        />
                        <label
                          className="mb-2 form-check-label"
                          htmlFor="foundation5"
                        >
                          創世基金會
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <div className="my-3">
                    <FormControlLabel
                      control={
                        <Checkbox
                          required
                          sx={{
                            '& .MuiSvgIcon-root': { fontSize: 28 },
                            color: '#bdbdbd',
                            '&.Mui-checked': {
                              color: '#2B4f61',
                            },
                          }}
                        />
                      }
                      label="我同意接受服務條款及隱私權政策。"
                      sx={{
                        marginLeft: -1,
                        '& .MuiFormControlLabel-label': {
                          '@media (max-width: 391px)': {
                            fontSize: '14px',
                          },
                          fontSize: '16px',
                          marginLeft: -1,
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              className={`col-lg-3 col-md-5 col-sm-7 col-12 ${styles['cart-right']}`}
            >
              <div
                className={`px-2 py-1 text-center border-bottom border-secondary ${styles['h1']} ${styles['cart-right-title']}`}
              >
                訂單詳情
              </div>
              <div className="border-bottom border-secondary pb-4">
                {products && products.length > 0 && (
                  <div
                    className={`my-2 px-2 ${styles['h3']} ${styles['right-body-title']}`}
                  >
                    商品
                  </div>
                )}

                {products.map((v) => {
                  return (
                    <div
                      key={v.id}
                      className="d-flex gap-4 ms-3 mt-md-4 mt-3 mb-4 mb-md-5 "
                    >
                      <div className={`col-2 ${styles['product-img']}`}>
                        <Image
                          src={`http://localhost:3005/images/hello/${v.img}`}
                          alt=""
                          width={500}
                          height={500}
                          className="w-100 h-100"
                        ></Image>
                      </div>
                      <div className="d-flex flex-column justify-content-evenly col-8 ">
                        <div
                          title={v.name}
                          className={`${styles['productTitle']} ${styles['h5']}`}
                        >
                          {v.name}
                        </div>
                        <div className="d-flex justify-content-between mt-md-3 mt-2">
                          <div className={`${styles['h4']}`}>${v.price}</div>
                          <div className={`${styles['h4']}`}>x{v.qty}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {courses && courses.length > 0 && (
                  <div
                    className={`my-2 px-2 ${styles['h3']} ${styles['right-body-title']}`}
                  >
                    課程
                  </div>
                )}
                {courses.map((v) => {
                  return (
                    <div
                      key={v.id}
                      className="d-flex gap-4 ms-3 mt-md-4 mt-3 mb-4 mb-md-5 "
                    >
                      <div className={`col-2 ${styles['product-img']}`}>
                        <Image
                          src={`http://localhost:3005/images/course/${v.img}`}
                          width={10}
                          height={10}
                          alt=""
                          className="w-100 h-100"
                        ></Image>
                      </div>
                      <div className="d-flex flex-column justify-content-evenly col-8">
                        <div
                          title={v.name}
                          className={`${styles['h5']} ${styles['title']}`}
                        >
                          {v.name}
                        </div>
                        <div
                          className={`mt-md-3 mt-2 ${styles['h6']} ${styles['course-color']}`}
                        >
                          時間: {v.schedule}
                          <br />
                          地點: {v.location}
                        </div>
                        <div className="d-flex justify-content-between mt-3">
                          <div className={`${styles['h4']}`}>${v.price}</div>
                          <div className={`${styles['h4']}`}>X{v.qty}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-md-3 mt-4 px-md-0 px-3">
                <div className="mt-3 mb-3">
                  <div
                    className={` d-flex align-items-center ${styles['coupon']} ${styles['h4']}`}
                  >
                    <div className="ms-2 mt-2 ps-2 col-3">
                      <RiCoupon2Line className="mb-1" fontSize={30} />
                    </div>
                    {selectCoupon.coupon_name
                      ? selectCoupon.coupon_name
                      : '未選取優惠券'}
                  </div>
                </div>
                <div
                  className={`mt-2 d-flex justify-content-between ${styles['h3']}`}
                >
                  總金額
                  <span>{totalPrice + totalPrice1}</span>
                </div>
                <div
                  className={`d-flex justify-content-between mt-1 ${styles['h3']}`}
                >
                  運費
                  <span />${freight}
                </div>
                {selectCoupon.coupon_name ? (
                  <div
                    className={`d-flex justify-content-between mt-1 ${styles['h3']}`}
                  >
                    優惠券折扣
                    <span>-{selectCoupon.discountAmount}</span>
                  </div>
                ) : (
                  ''
                )}

                <div
                  className={`d-flex justify-content-between mt-1 ${styles['h2']}`}
                >
                  <div>
                    實付金額
                    <span className={`ms-2 ${styles['h5']}`}>
                      (共{totalQty + totalQty1}件商品)
                    </span>
                  </div>
                  <span className={`${styles.total}`}>
                    $
                    {totalPrice +
                      totalPrice1 -
                      (selectCoupon.discountAmount || 0) +
                      freight}
                  </span>
                </div>
              </div>
              <div className="d-md-flex d-none justify-content-center gap-5 mt-5">
                <Link href="http://localhost:3000/cart">
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: '#2B4f61',
                      color: '#2B4f61',
                      fontSize: '18px',
                      '&:hover': {
                        borderColor: '#2B4f61',
                        backgroundColor: '#2B4f61',
                        color: 'white',
                      },
                    }}
                  >
                    上一頁
                  </Button>
                </Link>
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    borderColor: '#2B4f61',
                    color: 'white',
                    fontSize: '18px',
                    backgroundColor: '#2B4f61',
                    '&:hover': {
                      borderColor: '#e4960e',
                      backgroundColor: '#e4960e',
                      color: 'black',
                    },
                  }}
                >
                  結帳
                </Button>
              </div>
              <div className="d-md-none d-flex justify-content-center mt-4">
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    borderColor: '#2B4f61',
                    color: 'white',
                    fontSize: '18px',
                    backgroundColor: '#2B4f61',
                    '@media (max-width: 391px)': {
                      transform: 'scale(0.8)',
                      transformOrigin: 'top left',
                    },
                    '&:hover': {
                      borderColor: '#e4960e',
                      backgroundColor: '#e4960e',
                      color: 'black',
                    },
                  }}
                >
                  結帳
                </Button>
              </div>
            </div>
          </div>
        </form>
        <Footer />
      </div>
    </>
  )
}
