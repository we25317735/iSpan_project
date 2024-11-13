import React from 'react'
import styles from '@/styles/product.module.scss'
import Link from 'next/link'

import Image from 'next/image'
import { LiaAngleRightSolid } from 'react-icons/lia'
import { FaBullhorn } from 'react-icons/fa'
import { FaTag } from 'react-icons/fa'
import { FaHeart } from 'react-icons/fa'
import { FaAngleLeft } from 'react-icons/fa6'
import { FaAngleRight } from 'react-icons/fa6'
import { FaAnglesLeft } from 'react-icons/fa6'
import { FaAnglesRight } from 'react-icons/fa6'
import { FaFire } from 'react-icons/fa6'
import { FaUsers } from 'react-icons/fa6'
import { FaStar } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
// 取出當前使用者
import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { TbHexagonNumber1Filled } from 'react-icons/tb'
import { TbHexagonNumber2Filled } from 'react-icons/tb'
import { TbHexagonNumber3Filled } from 'react-icons/tb'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Loading from '@/components/Loading'

import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Slider,
  Box,
} from '@mui/material'
import { set } from 'lodash'
// 在組件內部
export default function Product() {
  const { user } = useContext(AuthContext) // 抓使用者資訊
  const [products, setProducts] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [type, setType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [categories, setCategories] = useState([])
  const [specialProducts, setSpecialProducts] = useState([])
  const [topRatedProducts, setTopRatedProducts] = useState([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [limitedTime, setLimitedTime] = useState(null)
  const [favorites, setFavorites] = useState({})
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [hotProducts, setHotProducts] = useState(true)
  const [priceRange, setPriceRange] = useState([0, 89900])
  const [minMaxPrice, setMinMaxPrice] = useState([0, 89900])
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (isInitialLoad) {
      getProduct() // 获取所有商品
      setIsInitialLoad(false)
    } else {
      if (type || categoryId) {
        getProduct() // 根据 type 和 categoryId 过滤商品
      }
    }
  }, [type, categoryId, currentPage, sortBy, minPrice, maxPrice, isInitialLoad])
  useEffect(() => {
    if (!isInitialLoad) {
      getProduct() // 根据 type 和 categoryId 过滤商品
    }
  }, [type, categoryId, currentPage, sortBy, minPrice, maxPrice])
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    const { type } = router.query
    if (type) {
      setType(type)
      getProduct()
      getCategories()
    }
  }, [router.query])
  const fetchPriceRange = async () => {
    try {
      const response = await fetch(
        `http://localhost:3005/api/product/price-range?type=${type}&category_id=${categoryId}`
      )
      const data = await response.json()
      if (data.status === 'success') {
        let minPrice = data.data.minPrice
        let maxPrice = data.data.maxPrice
        if (minPrice === maxPrice) {
          maxPrice += 1 // 確保最大值比最小值大
        }
        setMinMaxPrice([minPrice, maxPrice])
        setPriceRange([minPrice, maxPrice])
      }
    } catch (error) {
      console.error('Error fetching price range:', error)
    }
  }

  useEffect(() => {
    fetchPriceRange()
  }, [type, categoryId])

  const handlePriceChange = (event, newValue) => {
    setPriceRange(newValue)
  }
  const handlePriceChangeCommitted = () => {
    setMinPrice(priceRange[0])
    setMaxPrice(priceRange[1])
    getProduct()
  }
  const handleClick = () => {
    router.reload() // 重新加载当前页面
  }

  const getCategories = async () => {
    if (type) {
      let apiUrl = `http://localhost:3005/api/product/categories?type=${type}`
      try {
        const res = await fetch(apiUrl)
        const data = await res.json()
        if (data.status === 'success') {
          setCategories(data.data.categories)
        } else {
          console.error('Failed to fetch categories:', data.message)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
  }
  const getProduct = async () => {
    let apiUrl = `http://localhost:3005/api/product?page=${currentPage}&type=${
      type || ''
    }&category_id=${
      categoryId || ''
    }&sort=${sortBy}&min_price=${minPrice}&max_price=${maxPrice}`

    try {
      const res = await fetch(apiUrl)
      const data = await res.json()
      if (data.status === 'success') {
        setProducts(data.data.products)
        setTotalPages(data.data.totalPages)
        setTotalProducts(data.data.totalProducts)
      } else {
        console.error('Failed to fetch products:', data.message)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }
  const renderPagination = () => {
    const pageNumbers = []
    const maxPages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2))
    let endPage = Math.min(totalPages, startPage + maxPages - 1)

    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    return pageNumbers.map((page) => (
      <a
        key={page}
        onClick={(event) => {
          handlePageChange(page)
          event.preventDefault()
        }}
        className={currentPage === page ? styles.selected : ''}
        href="#"
      >
        {page}
      </a>
    ))
  }
  useEffect(() => {
    if (user) {
      fetchFavorites()
    }
  }, [user])

  const fetchFavorites = async () => {
    if (!user) return
    try {
      const response = await fetch(
        `http://localhost:3005/api/product/favorites/${user.id}`
      )
      const data = await response.json()
      //{"status":"success","favorites":[{"product_id":14},{"product_id":5}]}
      if (data.status === 'success') {
        const favMap = {}
        data.favorites.forEach((fav) => {
          favMap[fav.product_id] = true
          //{14: true, 5: true}
          //favMap的物件包住map下來的每個商品id，為true值
        })
        setFavorites(favMap)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }
  const toggleFavorite = async (productId) => {
    if (!user) {
      alert('請先登入')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:3005/api/product/favorite',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ user_id: user.id, product_id: productId }),
        }
      )

      const data = await response.json()
      if (data.status === 'success') {
        setFavorites((prev) => ({
          ...prev,
          [productId]: !prev[productId],
        }))
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  useEffect(() => {
    const { type, category_id, scrollTo } = router.query

    if (type) setType(type)
    if (category_id) setCategoryId(category_id)

    if (scrollTo === 'product-top') {
      const productTop = document.querySelector(`.${styles['product-top']}`)
      if (productTop) {
        productTop.scrollIntoView({ behavior: 'smooth' })
      }
    }

    // 仅在 type 或 category_id 更新后调用 getProduct
  }, [type, categoryId])

  useEffect(() => {
    if (type || categoryId) {
      getProduct()
      getCategories()
    }
  }, [type, categoryId, currentPage, sortBy, minPrice, maxPrice])
  useEffect(() => {
    getCategories()
  }, [type])

  useEffect(() => {
    const fetchSpecialProducts = async () => {
      try {
        const response = await fetch(
          'http://localhost:3005/api/product/special'
        )
        const data = await response.json()
        if (data.status === 'success') {
          setSpecialProducts(data.data.products)
        }
      } catch (error) {
        console.error('Error fetching special products:', error)
      }
    }

    fetchSpecialProducts()
  }, [])

  useEffect(() => {
    const fetchHotProducts = async () => {
      try {
        const response = await fetch(
          'http://localhost:3005/api/product/hot-products'
        )
        const data = await response.json()
        if (data.status === 'success') {
          setHotProducts(data.data.products)
        }
      } catch (error) {
        console.error('Error fetching hot products:', error)
      }
    }

    fetchHotProducts()
  }, [])
  useEffect(() => {
    const fetchTopRatedProducts = async () => {
      try {
        const response = await fetch(
          'http://localhost:3005/api/product/top-rated'
        )
        const data = await response.json()
        if (data.status === 'success') {
          setTopRatedProducts(data.data.products)
        }
      } catch (error) {
        console.error('Error fetching top rated products:', error)
      }
    }

    fetchTopRatedProducts()
  }, [])
  useEffect(() => {
    const fetchLimitedTime = async () => {
      try {
        const response = await fetch(
          'http://localhost:3005/api/product/limited-time'
        )
        const data = await response.json()
        if (data.status === 'success') {
          setLimitedTime(new Date(data.data.limitedTime))
          //轉換為本地時間，原本json會是new Date("2024-08-30T04:00:00.000Z")變成2024年8月30日12:00:00
        }
      } catch (error) {
        console.error('Error fetching limited time:', error)
      }
    }

    fetchLimitedTime()
  }, [])

  useEffect(() => {
    if (limitedTime) {
      const timer = setInterval(() => {
        const now = new Date()
        const difference = limitedTime.getTime() - now.getTime()

        if (difference > 0) {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24))
          const hours = Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          )
          const minutes = Math.floor(
            (difference % (1000 * 60 * 60)) / (1000 * 60)
          )
          const seconds = Math.floor((difference % (1000 * 60)) / 1000)

          const daysElement = document.getElementById('days')
          const hoursElement = document.getElementById('hours')
          const minutesElement = document.getElementById('minutes')
          const secondsElement = document.getElementById('seconds')

          if (daysElement) {
            daysElement.textContent = days.toString().padStart(2, '0')
          }
          if (hoursElement) {
            hoursElement.textContent = hours.toString().padStart(2, '0')
          }
          if (minutesElement) {
            minutesElement.textContent = minutes.toString().padStart(2, '0')
          }
          if (secondsElement) {
            secondsElement.textContent = seconds.toString().padStart(2, '0')
          }
        } else {
          clearInterval(timer)
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [limitedTime])

  const handlePageChange = (page) => {
    setCurrentPage(page)
    if (page !== 1) {
      const productTop = document.querySelector(`.${styles['product-top']}`)
      if (productTop) {
        productTop.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }
  //     let apiUrl = `http://localhost:3005/api/product?page=${currentPage}&type=${type}&category_id=${categoryId}&sort=${sortBy}&min_price=${minPrice}&max_price=${maxPrice}`
  // const { types } = router.query

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }
  return (
    <>
      <div className={`container-fluid ${styles.backg} mt-3`}>
        <Header />
        <div className={`container ${styles['one']} mt-5`}>
          <div className={`${styles['bread']}`}>
            <div className={`${styles['innerBread']}`}>
              <Link href="/IGotBrew">首頁</Link>
              <LiaAngleRightSolid />
            </div>
            <div className={`${styles['innerBread']}`}>
              <Link href="/IGotBrew">線上商店</Link>
              <LiaAngleRightSolid />
            </div>
            <div className={`${styles['innerBread']} ${styles['breadThis']}`}>
              <Link href="/product" onClick={handleClick}>
                <p className={`m-0`}>商品總覽</p>
              </Link>
            </div>
          </div>
          <div className={`${styles['top-img-div']}`}>
            <Link
              href="/product"
              onClick={handleClick}
              className={`${styles['titlebk']}`}
            >
              <p className={`m-0`}>商品總覽</p>
            </Link>
            <Image
              src={`http://localhost:3005/images/hello/product-top.png`}
              alt=""
              width={100}
              height={100}
            />
          </div>
          <div className={`${styles['announce']}`}>
            <FaBullhorn className={`${styles['load']}`} />
            <p>7/1 新品上市！ 各種好康商品任你選</p>
          </div>
        </div>
        <div className={`container-fluid ${styles['two']}`}>
          <Image
            src={`http://localhost:3005/images/hello/bg-top.png`}
            alt=""
            width={100}
            height={100}
          />
          <div className="container">
            <div className={`${styles['countdown-container']}`}>
              <span className={`${styles['title']}`}>限時特賣</span>
              <div className={`${styles['countdown']}`}>
                <div className={`${styles['time-box']}`}>
                  <span id="days">00</span>
                </div>
                <span className={`${styles['unit']}`}>天</span>
                <div className={`${styles['time-box']}`}>
                  <span id="hours">00</span>
                </div>
                <span className={`${styles['unit']}`}>時</span>
                <div className={`${styles['time-box']}`}>
                  <span id="minutes">00</span>
                </div>
                <span className={`${styles['unit']}`}>分</span>
                <div className={`${styles['time-box']}`}>
                  <span id="seconds">00</span>
                </div>
                <span className={`${styles['unit']}`}>秒</span>
              </div>
            </div>
            <div className={`${styles['product-cards']}`}>
              {specialProducts.map((product) => (
                <a
                  key={product.id}
                  className={`${styles['product-card']}`}
                  href={`/product/${product.id}`}
                >
                  <FaTag className={`${styles['tag']}`} />
                  <Image
                    src={`http://localhost:3005/images/hello/${product.img}`}
                    alt=""
                    width={100}
                    height={100}
                  />
                  <div className={`${styles['product-card-right']}`}>
                    <div className={`${styles['right-title']}`}>
                      {product.name}
                    </div>
                    <div className={`${styles['right-down']}`}>
                      <div className={`${styles['price']}`}>
                        <div className={`${styles['price']}`}>
                          <div
                            className={`${styles['front-price']} ${
                              product.discount !== 1
                                ? styles['has-discount']
                                : ''
                            }`}
                          >
                            ${product.price}
                          </div>
                          {product.discount !== 1 && (
                            <div className={`${styles['off-price']}`}>
                              ${(product.price * product.discount).toFixed(0)}
                              {/* 價格為無條件捨取 */}
                            </div>
                          )}
                        </div>
                      </div>
                      <button className={`${styles['heart-btn']}`}>
                        <FaHeart
                          className={`${styles['heart']} ${
                            favorites[product.id] ? styles['active'] : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault() // 阻止默認行為
                            e.stopPropagation() // 阻止事件冒泡
                            toggleFavorite(product.id) // 切換收藏狀態
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className={`container ${styles['three']}`}>
          <div className={`${styles['product-top']}`} id="ptop">
            <div className={`${styles['filter']}`}>
              {/* 種類選擇 */}
              <FormControl
                variant="outlined"
                margin="normal"
                sx={{
                  width: '200px',
                  margin: 0,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: 'white',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1b3947', // 設置飄上去的字體顏色
                  },
                  '& .MuiSelect-root': {
                    fontSize: '1.4rem', // 設置框框裡的字體大小
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.4rem', // 設置下拉選單選項的字體大小
                  },
                }}
              >
                <InputLabel sx={{ fontSize: '1.3rem', color: '#1b3947' }}>
                  種類
                </InputLabel>
                <Select
                  sx={{ fontSize: '1.4rem', color: '#1b3947' }}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value)
                    setCategoryId('') // 重置細項類別
                    fetchPriceRange()
                    setMinPrice('0')
                    setMaxPrice('89900')
                  }}
                  label="種類"
                >
                  <MenuItem
                    value=""
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    全部
                  </MenuItem>
                  <MenuItem
                    value="bean"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    咖啡豆
                  </MenuItem>
                  <MenuItem
                    value="machine"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    咖啡機
                  </MenuItem>
                  <MenuItem
                    value="other"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    其他/配件
                  </MenuItem>
                </Select>
              </FormControl>

              {/* 細項類別選擇 */}
              {type && (
                <FormControl
                  variant="outlined"
                  margin="normal"
                  sx={{
                    width: '200px',
                    margin: 0,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {},
                      '&:hover fieldset': {
                        borderColor: '#eba92a',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#eba92a',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#1b3947', // 設置飄上去的字體顏色
                    },
                    '& .MuiSelect-root': {
                      fontSize: '1.4rem', // 設置框框裡的字體大小
                    },
                    '& .MuiMenuItem-root': {
                      fontSize: '1.4rem', // 設置下拉選單選項的字體大小
                    },
                  }}
                >
                  <InputLabel sx={{ fontSize: '1.3rem', color: '#1b3947' }}>
                    細項類別
                  </InputLabel>
                  <Select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value)
                      fetchPriceRange()
                    }}
                    sx={{ fontSize: '1.4rem', color: '#1b3947' }}
                    label="細項類別"
                  >
                    <MenuItem
                      value=""
                      sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                    >
                      請選擇細項類別
                    </MenuItem>
                    {categories.map((category) => (
                      <MenuItem
                        key={category.id}
                        value={category.id}
                        sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                      >
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* 價格範圍選擇 */}
              <Box
                sx={{
                  width: '240px',
                  mt: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: 0,
                  borderRadius: '3px',
                  padding: '4px 12px 0px',
                }}
              >
                <p className={`${styles['price-t']}`}>價格</p>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Slider
                    value={priceRange}
                    onChange={handlePriceChange}
                    onChangeCommitted={handlePriceChangeCommitted}
                    valueLabelDisplay="on"
                    min={minMaxPrice[0]}
                    max={minMaxPrice[1]}
                    sx={{
                      m: 1,
                      minWidth: 140,
                      color: '#2b4f61',
                      display: 'flex',
                      alignSelf: 'end',
                      '& .MuiSlider-thumb': {
                        backgroundColor: '#2b4f61',
                        margin: 0,
                        width: '16px',
                        height: '16px',
                      },
                      '& .MuiSlider-track': {
                        backgroundColor: '#2b4f61',
                        margin: 0,
                      },
                      '& .MuiSlider-rail': {
                        backgroundColor: '#2b4f61',
                        margin: 0,
                      },
                      '& .MuiSlider-valueLabel': {
                        backgroundColor: 'transparent',
                        color: '#2b4f61',
                        fontSize: '1.4rem', // 调整数字的字体大小
                        top: 0, // 调整数字的垂直位置
                        margin: 0,
                      },
                    }}
                  />

                  {/* <Typography sx={{ ml: 2, minWidth: '120px' }}>
                    ${priceRange[0]} - ${priceRange[1]}
                  </Typography> */}
                </Box>
              </Box>
            </div>

            <div className={`${styles['order']}`}>
              <p className={`${styles['total']}`}>共{totalProducts}筆資料</p>
              <FormControl
                variant="outlined"
                margin="normal"
                sx={{
                  width: '200px',
                  margin: 0,
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    '& fieldset': {
                      borderColor: 'white',
                    },
                    '&:hover fieldset': {
                      borderColor: 'white',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#1b3947', // 设置飘上去的字体颜色
                    fontSize: '1.4rem', // 设置标签字体大小
                  },
                  '& .MuiSelect-root': {
                    fontSize: '1.4rem', // 设置框框里的字体大小
                    color: '#1b3947', // 设置框框里的字体颜色
                  },
                  '& .MuiMenuItem-root': {
                    fontSize: '1.4rem', // 设置下拉选项的字体大小
                    color: '#1b3947', // 设置下拉选项的字体颜色
                  },
                }}
              >
                <InputLabel>排序方式</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  label="排序方式"
                  sx={{ fontSize: '1.4rem', color: '#1b3947' }}
                >
                  <MenuItem
                    value="default"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    預設排序
                  </MenuItem>
                  <MenuItem
                    value="price_asc"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    看最便宜
                  </MenuItem>
                  <MenuItem
                    value="price_desc"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    看最貴
                  </MenuItem>
                  <MenuItem
                    value="rating_desc"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    好評榜
                  </MenuItem>
                  <MenuItem
                    value="total_sold_desc"
                    sx={{ fontSize: '1.3rem', color: '#1b3947' }}
                  >
                    熱銷榜
                  </MenuItem>
                </Select>
              </FormControl>
            </div>
          </div>
          <div className={`row gx-4 ${styles['my-row']}`}>
            {products.map((product) => (
              <div
                key={product.id}
                className={`col-6 col-md-4 col-lg-3 ${styles['my-col']}`}
              >
                <a
                  className={`${styles['overview-card']}`}
                  href={`/product/${product.id}`}
                >
                  <Image
                    src={`http://localhost:3005/images/hello/${product.img}`}
                    alt=""
                    width={100}
                    height={100}
                    onError={(e) => {
                      e.target.src =
                        'http://localhost:3005/images/hello/bd-8.webp'
                    }}
                  />
                  <div className={`${styles['overview-down']}`}>
                    <p className={`${styles['overview-title']}`}>
                      {product.name}
                    </p>
                    {sortBy === 'rating_desc' && (
                      <div className={`${styles['rank-star']}`}>
                        {product.average_score > 3.5 && (
                          <>
                            <span className={`${styles['high-rating-label']}`}>
                              好評榜
                            </span>
                            <p className="m-0">
                              {typeof product.average_score === 'number'
                                ? product.average_score.toFixed(1)
                                : parseFloat(
                                    product.average_score || 0
                                  ).toFixed(1)}
                              {/* 如果不是數字則轉為浮點數數字，如果是空值或undefined則轉為 0  */}
                            </p>
                          </>
                        )}
                        {product.average_score < 3.5 &&
                          product.average_score > 1.0 && (
                            <p className="m-0">
                              {typeof product.average_score === 'number'
                                ? product.average_score.toFixed(1)
                                : parseFloat(
                                    product.average_score || 0
                                  ).toFixed(1)}
                              {/* 如果不是數字則轉為浮點數數字，如果是空值或undefined則轉為 0  */}
                            </p>
                          )}
                        {product.average_score <= 1.0 && (
                          <p className="m-0">暫無評分</p>
                        )}

                        <FaStar className={`${styles['yellow-star']}`} />
                      </div>
                    )}
                    {sortBy === 'total_sold_desc' && (
                      <div>
                        {product.total_sold >= 30 && (
                          <div className="d-flex gap-1 align-items-center justify-content-between">
                            <span className={`${styles['hot-selling-label']}`}>
                              熱銷榜
                            </span>
                            <div className={`${styles['nonono']} d-flex gap-2`}>
                              <span className={`${styles['hot-label']}`}>
                                已售出
                              </span>
                              <p className="m-0">{product.total_sold}</p>
                            </div>
                          </div>
                        )}
                        {product.total_sold < 30 && product.total_sold > 1 && (
                          <div
                            className={`${styles['nonono']} d-flex gap-2 justify-content-end`}
                          >
                            <span className={`${styles['hot-label']}`}>
                              已售出
                            </span>
                            <p className="m-0">{product.total_sold}</p>
                          </div>
                        )}
                        {product.total_sold < 1 && (
                          <div
                            className={`${styles['nonono']} d-flex gap-2 justify-content-end`}
                          >
                            <span className={`${styles['hot-label']}`}>
                              暫未售出
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className={`${styles['overview-bottom']}`}>
                      <p className={`${styles['overview-price']}`}>
                        <div
                          className={`${styles['front-price']} ${
                            product.discount !== 1 ? styles['has-discount'] : ''
                          }`}
                        >
                          ${product.price}
                        </div>
                        {product.discount !== 1 && (
                          <div className={`${styles['off-price']}`}>
                            ${(product.price * product.discount).toFixed(0)}
                            {/* 價格為無條件捨取 */}
                          </div>
                        )}
                      </p>
                      <button className={`${styles['heart-btn']}`}>
                        <FaHeart
                          className={`${styles['heart']} ${
                            favorites[product.id] ? styles['active'] : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault() // 阻止默認行為
                            e.stopPropagation() // 阻止事件冒泡
                            toggleFavorite(product.id) // 切換收藏狀態
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
          <div className={`${styles['pagination']}`}>
            <a
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(1)
              }}
              className={currentPage === 1 ? styles.disabled : ''}
              href="#"
            >
              <FaAnglesLeft />
            </a>
            <a
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage - 1)
              }}
              className={currentPage === 1 ? styles.disabled : ''}
              href="#"
            >
              <FaAngleLeft />
            </a>
            {renderPagination()}
            <a
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(currentPage + 1)
              }}
              className={currentPage === 1 ? styles.disabled : ''}
              href="#"
            >
              <FaAngleRight />
            </a>
            <a
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(totalPages)
              }}
              className={currentPage === totalPages ? styles.disabled : ''}
              href="#"
            >
              <FaAnglesRight />
            </a>
          </div>
        </div>
        <div className={`container-fluid ${styles['four']}`}>
          <Image
            className={`${styles['bg-down']}`}
            src={`http://localhost:3005/images/hello/bg-down.png`}
            alt=""
            width={100}
            height={100}
          />
          <div className={`container ${styles['container-four']}`}>
            <div className={`${styles['ranking']}`}>
              <div className={`d-flex ${styles['four-title']}`}>
                <p className={`d-flex ${styles['title']}`}>熱門推薦</p>
                <FaFire className={`${styles['title-i']}`} />
              </div>
              <div className={`${styles['product-cards']}`}>
                {hotProducts &&
                Array.isArray(hotProducts) &&
                hotProducts.length > 0 ? (
                  hotProducts.map((product, index) => (
                    <a
                      key={product.id}
                      className={`${styles['product-card']}`}
                      href={`/product/${product.id}`}
                    >
                      {/* 根據排名顯示相應的圖標 */}
                      <div className={`${styles['ranking-icon']}`}>
                        {index === 0 && <TbHexagonNumber1Filled />}
                        {index === 1 && <TbHexagonNumber2Filled />}
                        {index === 2 && <TbHexagonNumber3Filled />}
                      </div>

                      <Image
                        className={`${styles['photo']}`}
                        src={`http://localhost:3005/images/hello/${product.img}`}
                        alt=""
                        width={100}
                        height={100}
                      />
                      <div className={`${styles['product-card-right']}`}>
                        <div className={`${styles['right-title']}`}>
                          {product.name}
                        </div>

                        <div className={`${styles['right-down']}`}>
                          <div className={`${styles['price']}`}>
                            <div
                              className={`${styles['front-price']} ${
                                product.discount !== 1
                                  ? styles['has-discount']
                                  : ''
                              }`}
                            >
                              ${product.price}
                            </div>
                            {product.discount !== 1 && (
                              <div className={`${styles['off-price']}`}>
                                ${(product.price * product.discount).toFixed(0)}
                              </div>
                            )}
                          </div>
                          <div className="d-flex gap-4 align-items-center">
                            <div className={`${styles['nonono']} d-flex gap-1`}>
                              <span className={`${styles['hot-label']}`}>
                                已售出
                              </span>
                              <p className="m-0">{product.total_sold}</p>
                            </div>
                            <button className={`${styles['heart-btn']}`}>
                              <FaHeart
                                className={`${styles['heart']} ${
                                  favorites[product.id] ? styles['active'] : ''
                                }`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleFavorite(product.id)
                                }}
                              />
                            </button>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <p>No hot products found.</p>
                )}
              </div>

              <a
                className={`d-flex ${styles['view-more']}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  const productTop = document.querySelector(
                    `.${styles['product-top']}`
                  )
                  if (productTop) {
                    productTop.scrollIntoView({ behavior: 'smooth' })
                  }
                  setSortBy('total_sold_desc') // 切換排序為"熱門榜"
                  setType('')
                  setCategoryId('')
                  setMinPrice('0')
                  setMaxPrice('89900')
                  setCurrentPage('1')
                }}
              >
                <p>查看更多</p>
                <FaAngleRight />
              </a>
            </div>
            <div className={`${styles['good-command']}`}>
              <div className={`d-flex ${styles['four-title']}`}>
                <p className={`d-flex ${styles['title']}`}>好評如潮</p>
                <FaUsers className={`${styles['title-i']}`} />
              </div>
              <div className={`${styles['product-cards']}`}>
                {topRatedProducts.map((product) => (
                  <a
                    key={product.id}
                    className={`${styles['product-card']}`}
                    href={`/product/${product.id}`}
                  >
                    <div className={`${styles['rank-star']}`}>
                      <p className="m-0">
                        {typeof product.average_score === 'number'
                          ? product.average_score.toFixed(1)
                          : parseFloat(product.average_score || 0).toFixed(1)}
                      </p>
                      <FaStar className={`${styles['yellow-star']}`} />
                    </div>
                    <Image
                      className={`${styles['photo']}`}
                      src={`http://localhost:3005/images/hello/${product.img}`}
                      alt=""
                      width={100}
                      height={100}
                    />
                    <div className={`${styles['product-card-right']}`}>
                      <div className={`${styles['right-title']}`}>
                        {product.name}
                      </div>
                      <div className={`${styles['right-down']}`}>
                        <div className={`${styles['price']}`}>
                          <div
                            className={`${styles['front-price']} ${
                              product.discount !== 1
                                ? styles['has-discount']
                                : ''
                            }`}
                          >
                            ${product.price}
                          </div>
                          {product.discount !== 1 && (
                            <div className={`${styles['off-price']}`}>
                              ${(product.price * product.discount).toFixed(0)}
                              {/* 價格為無條件捨取 */}
                            </div>
                          )}
                        </div>
                        <button className={`${styles['heart-btn']}`}>
                          <FaHeart
                            className={`${styles['heart']} ${
                              favorites[product.id] ? styles['active'] : ''
                            }`}
                            onClick={(e) => {
                              e.preventDefault() // 阻止默認行為
                              e.stopPropagation() // 阻止事件冒泡
                              toggleFavorite(product.id) // 切換收藏狀態
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
              <a
                className={`d-flex ${styles['view-more']}`}
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  const productTop = document.querySelector(
                    `.${styles['product-top']}`
                  )
                  if (productTop) {
                    productTop.scrollIntoView({ behavior: 'smooth' })
                  }
                  setSortBy('rating_desc') // 切換排序為"好評榜"
                  setType('')
                  setCategoryId('')
                  setMinPrice('0')
                  setMaxPrice('89900')
                  setCurrentPage('1')
                }}
              >
                <p>查看更多</p>
                <FaAngleRight />
              </a>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
