import React, { useState, useContext, useEffect } from 'react'
import styles from './asset/style/nini.module.scss' // 使用 SCSS 模組
import Phone_menu from './Phone_menu/index' // 使用 SCSS 模組
import { FaShoppingCart, FaBars, FaSearch } from 'react-icons/fa'
import { FaXmark } from 'react-icons/fa6'
import Link from 'next/link'
import { AuthContext } from '@/context/AuthContext'
import useAuth from '@/hooks/useAuth'
import { useRouter } from 'next/router'
import { useCart } from '@/hooks/use-cart'
import IGOTBREW from './asset/img/IGOTBREW 1.png' // LOGO
import WhiteIcon from './asset/img/white-icon.png' // LOGO
import VectorIcon from './asset/img/Vector.png' //搜尋
import carIcon from './asset/img/car.png' //購物車
import sandwichIcon from './asset/img/sandwich.png' //三明治
import userIcon from './asset/img/user.png' // 使用者
import { FaUserCircle } from 'react-icons/fa'
import Image from 'next/image'
import xx from './asset/img/xx.png' // 使用者
import { IoClose } from 'react-icons/io5'
import { Button } from 'react-bootstrap'
import { Button as MuiButton } from '@mui/material'

import useFirebase from '@/hooks/use-firebase' // google 登出
import Loading from '../Loading2' // loading 畫面

// 俊成新增
import {
  logout,
  lineLogout,
  lineLoginCallback,
  getUserById,
  parseJwt,
} from '@/services/user'
import toast, { Toaster } from 'react-hot-toast'
import { initUserData } from '@/hooks/use-auth'

export default function Header() {
  const { totalQty, totalQty1, cartItems, cartItems1 } = useCart()
  const totalItems = totalQty + totalQty1
  const [isMobile, setIsMobile] = useState(false)
  const [animationClass, setAnimationClass] = useState('') // 動畫效果
  const [animationToggle, setAnimationToggle] = useState(false) // 動畫效果開關(失敗維修中...)
  const [data, setData] = useState([])
  const [isShopMenuOpen, setIsShopMenuOpen] = useState(false)

  const [loading, setLoading] = useState(false) // 點擊直到切換的過渡

  // 登出的東西
  const { user } = useContext(AuthContext)

  // 新增的東西
  const { auth, setAuth, handleCheckAuth } = useAuth()

  // const { logout, login } = useAuth()

  // google 登出
  const { logoutFirebase } = useFirebase()

  const router = useRouter() // 初始化router

  //搜尋
  const [searchTerm, setSearchTerm] = useState('')
  const [searchType, setSearchType] = useState('all')

  useEffect(() => {
    if (!user) return
    setData(user)
  }, [user])

  // Link 加載畫面
  useEffect(() => {
    const Route_start = () => setLoading(true)
    const Route_complete = () => setLoading(false)
    const Route_error = () => setLoading(false)

    router.events.on('routeChangeStart', Route_start)
    router.events.on('routeChangeComplete', Route_complete)
    router.events.on('routeChangeError', Route_error)

    return () => {
      router.events.off('routeChangeStart', Route_start)
      router.events.off('routeChangeComplete', Route_complete)
      router.events.off('routeChangeError', Route_error)
    }
  }, [router.events])

  const handleSearch = (e) => {
    e.preventDefault()
    let searchTypeParam = searchType === 'all' ? 'products' : searchType
    window.location.href = `/search?q=${encodeURIComponent(
      searchTerm
    )}&type=${searchTypeParam}`
  }

  // 動畫效果
  const List_switch = (e) => {
    e?.preventDefault()

    if (animationToggle) {
      document.body.classList.remove(`${styles['no-scroll']}`)
      setAnimationClass(`${styles['slide-out']}`)
      setTimeout(() => {
        setAnimationToggle(!animationToggle)
        setAnimationClass('')
      }, 300)
    } else {
      setAnimationClass(`${styles['slide-in']}`)
      setAnimationToggle(!animationToggle)
      setAnimationToggle(true)
    }
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 登出測試
  const Logout_btn = () => {
    localStorage.removeItem('TheToken')

    /**
     * 登出直接寫在 a 標籤的 href 裡面
     */
  }

  // 購物車
  const [isOpen, setIsOpen] = useState(false)
  const productItems = cartItems
  const CousesItems = cartItems1

  return (
    <header>
      <input
        type="checkbox"
        className={`${styles[`filterInput`]}`}
        id="searchSwitch"
      />
      {!isMobile && (
        <div className={`${styles['XX']} ${styles.desktop}`}>
          <div className={styles['wrap-left']}>
            <div
              className={`${styles['shop-menu']} ${
                isShopMenuOpen ? styles['open'] : ''
              }`}
            >
              <Button
                title="商品頁面"
                onClick={() => setIsShopMenuOpen(!isShopMenuOpen)}
                className={styles.shopButton}
              >
                線上商店
              </Button>
              <div className={styles['dropdown-content']}>
                <Link href="/product">咖啡選購</Link>
                <Link href="/course">咖啡人的必修課</Link>
              </div>
            </div>
            <Link href="/article" title="咖啡專欄">
              咖啡專欄
            </Link>
            <Link href="/cafeMap" title="咖啡地圖">
              咖啡地圖
            </Link>
          </div>
          <div className={styles['wrap-middle']}>
            <Link href="/IGotBrew">
              <p className={styles.IGOTBREW}>Ｉ ＧＯＴ ＢＲＥＷ</p>
            </Link>
          </div>
          <div className={styles['wrap-right']}>
            <a href="">
              <label htmlFor="searchSwitch" style={{ cursor: 'pointer' }}>
                <FaSearch />
              </label>
            </a>
            <Link href="/cart" className={`${styles.dropdown1}`}>
              <FaShoppingCart
                sx={{ fontSize: '1.6rem' }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
              />
              {totalItems > 0 && (
                <span
                  className={styles['cart-count']}
                  style={{
                    position: 'absolute',
                    padding: '0px 4px',
                    borderRadius: '50%',
                    backgroundColor: '#EBA92B',
                    color: '#1b3947',
                    top: '-5px',
                    right: '-7px',
                  }}
                >
                  {totalItems}
                </span>
              )}
              {isOpen && (
                <div
                  className={styles['dropdown1-content']}
                  onMouseEnter={() => setIsOpen(true)}
                  onMouseLeave={() => setIsOpen(false)}
                >
                  <div className={`ps-3 py-3 ${styles.cartTitle}`}>
                    最近加入的商品
                  </div>
                  {productItems.length === 0 && CousesItems.length === 0 ? (
                    <div className="text-center py-3 fs-3">購物車為空</div>
                  ) : (
                    <>
                      {productItems.map((v) => (
                        <div
                          key={v.id}
                          className={`d-flex gap-3 ${styles['dropdown-item']}`}
                        >
                          <div className={`${styles.cartImg}`}>
                            <Image
                              src={`http://localhost:3005/images/hello/${v.img}`}
                              className="border w-100 h-100"
                              width={100}
                              height={100}
                              alt=""
                            />
                          </div>
                          <div>
                            <Link
                              className="text-decoration-none"
                              href={`/product/${v.id}`}
                            >
                              <div className={` ${styles.cartName}`}>
                                {v.name}
                              </div>
                            </Link>
                            <div className={`ms-2 mt-2 ${styles.cartQty}`}>
                              X{v.qty}
                            </div>
                          </div>
                          <div>${v.price}</div>
                        </div>
                      ))}
                      {CousesItems.map((v) => (
                        <div
                          key={v.id}
                          className={`d-flex gap-3 ${styles['dropdown-item']}`}
                        >
                          <div className={`${styles.cartImg}`}>
                            <Image
                              src={`http://localhost:3005/images/course/${v.img}`}
                              className="border w-100 h-100"
                              width={100}
                              height={100}
                              alt=""
                            />
                          </div>
                          <div>
                            <Link
                              className="text-decoration-none"
                              href={`/course/${v.id}`}
                            >
                              <div className={` ${styles.cartName}`}>
                                {v.name}
                              </div>
                            </Link>
                            <div className={`ms-2 mt-2 ${styles.cartQty}`}>
                              X{v.qty}
                            </div>
                          </div>
                          <div>${v.price}</div>
                        </div>
                      ))}
                    </>
                  )}
                  <div className={`d-flex justify-content-end`}>
                    <Link
                      href={
                        productItems.length > 0 || CousesItems.length > 0
                          ? '/cart'
                          : '/product'
                      }
                    >
                      <MuiButton
                        className="mt-2 me-3 mb-3"
                        variant="contained"
                        sx={{
                          borderColor: '#2B4f61',
                          color: 'white',
                          fontSize: '12px',
                          backgroundColor: '#2B4f61',
                          '&:hover': {
                            borderColor: '#e4960e',
                            backgroundColor: '#e4960e',
                            color: 'black',
                          },
                        }}
                      >
                        {productItems.length > 0 || CousesItems.length > 0
                          ? '查看購物車'
                          : '前往購物'}
                      </MuiButton>
                    </Link>
                  </div>
                </div>
              )}
            </Link>

            {/* 使用者頭像部份 */}
            <div className="dropdown">
              <a
                href="#"
                type="button"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                {/* 使用者頭像 */}
                {/* 使用者頭像 */}
                {user && user.img ? (
                  <img
                    src={`${user.img}`}
                    className="rounded-circle"
                    alt={user.name}
                    onError={(e) => {
                      e.target.onerror = null
                      e.target.src = `http://localhost:3005/images/user/${user.img}`
                    }}
                  />
                ) : (
                  <FaUserCircle />
                )}
              </a>

              {/* 新增的部份 */}
              <ul
                className="dropdown-menu"
                aria-labelledby="dropdownMenuButton1"
              >
                {user ? (
                  <li>
                    <Link href="/user" legacyBehavior>
                      <a
                        className="dropdown-item"
                        style={{ fontSize: '1.2rem' }}
                      >
                        會員中心
                      </a>
                    </Link>
                  </li>
                ) : null}

                {user && user.permissions == 1 && (
                  <>
                    <li>
                      <Link href="/anal" legacyBehavior>
                        <a
                          className="dropdown-item"
                          style={{ fontSize: '1.2rem' }}
                        >
                          後台管理
                        </a>
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  {user ? (
                    <a
                      className="dropdown-item"
                      href="http://localhost:3000/IGotBrew"
                      onClick={Logout_btn}
                      style={{ fontSize: '1.4rem' }}
                    >
                      登出
                    </a>
                  ) : (
                    <Link
                      className="dropdown-item"
                      href="/login"
                      // onClick={login}
                      style={{ fontSize: '1.4rem' }}
                    >
                      登入
                    </Link>
                  )}
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {isMobile && (
        <div
          className={`${styles['container-fluid']} ${styles.phone} d-flex justify-content-between`}
        >
          <div className={styles['wrap-left-phone']}>
            <Link href="/IGotBrew">
              <img src={WhiteIcon.src} alt="IGOTBREW" />
            </Link>
          </div>
          <div className={styles['wrap-right-phone']}>
            <a href="">
              <label htmlFor="searchSwitch" style={{ cursor: 'pointer' }}>
                <FaSearch />
              </label>
            </a>

            <Link href="/cart" className={`${styles.dropdown1}`}>
              <FaShoppingCart
                sx={{ fontSize: '1.6rem' }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
              />

              {totalItems > 0 && (
                <span
                  className={styles['cart-count']}
                  style={{
                    position: 'absolute',
                    padding: '0px 4px',
                    borderRadius: '50%',
                    backgroundColor: '#EBA92B',
                    color: '#1b3947',
                    top: '-5px',
                    right: '-7px',
                  }}
                >
                  {totalItems}
                </span>
              )}
              {isOpen && (
                <div
                  className={styles['dropdown1-content']}
                  onMouseEnter={() => setIsOpen(true)}
                  onMouseLeave={() => setIsOpen(false)}
                >
                  <div className={`ps-3 py-3 ${styles.cartTitle}`}>
                    最近加入的商品
                  </div>
                  {productItems.map((v) => (
                    <div
                      key={v.id}
                      className={`d-flex gap-3 ${styles['dropdown-item']}`}
                    >
                      <div className={`${styles.cartImg}`}>
                        <Image
                          src={`http://localhost:3005/images/hello/${v.img}`}
                          className="border w-100 h-100"
                          width={100}
                          height={100}
                          alt=""
                        />
                      </div>
                      <div>
                        <Link
                          className="text-decoration-none"
                          href={`/product/${v.id}`}
                        >
                          <div className={` ${styles.cartName}`}> {v.name}</div>
                        </Link>
                        <div className={`ms-2 mt-2 ${styles.cartQty}`}>
                          X{v.qty}
                        </div>
                      </div>
                      <div>${v.price}</div>
                    </div>
                  ))}
                  {CousesItems.map((v) => (
                    <div
                      key={v.id}
                      className={`d-flex gap-3 ${styles['dropdown-item']}`}
                    >
                      <div className={`${styles.cartImg}`}>
                        <Image
                          src={`http://localhost:3005/images/course/${v.img}`}
                          className="border w-100 h-100"
                          width={100}
                          height={100}
                          alt=""
                        />
                      </div>
                      <div>
                        <Link
                          className="text-decoration-none"
                          href={`/course/${v.id}`}
                        >
                          <div className={` ${styles.cartName}`}> {v.name}</div>
                        </Link>
                        <div className={`ms-2 mt-2 ${styles.cartQty}`}>
                          X{v.qty}
                        </div>
                      </div>
                      <div>${v.price}</div>
                    </div>
                  ))}
                  <div className={`d-flex justify-content-end`}>
                    <Link href="/cart">
                      <MuiButton
                        className="mt-2 me-3 mb-3"
                        variant="contained"
                        type="submit"
                        sx={{
                          borderColor: '#2B4f61',
                          color: 'white',
                          fontSize: '12px',
                          backgroundColor: '#2B4f61',
                          '&:hover': {
                            borderColor: '#e4960e',
                            backgroundColor: '#e4960e',
                            color: 'black',
                          },
                        }}
                      >
                        查看購物車
                      </MuiButton>
                    </Link>
                  </div>
                </div>
              )}
            </Link>
            <a
              href=""
              onClick={(e) => {
                List_switch(e)
              }}
            >
              <div
                style={{
                  transition: 'all 0.5s ease',
                  transform: animationToggle
                    ? 'rotate(90deg) scale(1.2)'
                    : 'rotate(0deg) scale(1)',
                  opacity: animationToggle ? 1 : 1,
                }}
              >
                {animationToggle ? <FaXmark /> : <FaBars />}
              </div>
            </a>
          </div>
        </div>
      )}
      {/* 放大鏡 + 搜尋系統 */}
      <div className={`${styles['searchFilter']}`}>
        <div
          className={`${styles['container']} ${styles['searchCenter']} container`}
        >
          <div className={`${styles['row']} row`}>
            <div className={`${styles['searchSelect']} col-2`}>
              <form action="">
                <select
                  className={`${styles['form-select']} ${styles['custom-select']} form-select custom-select`}
                  aria-label="Default select example"
                  onChange={(e) => setSearchType(e.target.value)}
                  value={searchType}
                >
                  <option value="all">全站</option>
                  <option value="products">商品</option>
                  <option value="courses">課程</option>
                  <option value="articles">文章</option>
                </select>
              </form>
            </div>
            <div className={`${styles['searchInput']} col-6`}>
              <div className={`input-group`}>
                <form
                  onSubmit={handleSearch}
                  className={`${styles['searchGroup']} d-flex`}
                >
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`${styles['form-control']} form-control`}
                    placeholder="關鍵字：咖啡豆、在家也能學拉花..."
                    aria-label="searchInput"
                    aria-describedby="button-addon2"
                  />
                  <button
                    className={`${styles['btn']} ${styles['searchButton']} btn`}
                    type="submit"
                    id="button-addon2"
                  >
                    <FaSearch className={`${styles['fa-magnifying-glass']}`} />
                  </button>
                </form>
              </div>
            </div>
          </div>
          <div className={`${styles['searchClose']}`}>
            <label htmlFor="searchSwitch">
              <IoClose className={`${styles['fa-xmark']}`} />
            </label>
          </div>
          <div className={`${styles['row']} row`}>
            <div
              className={`${styles['search-border']} ${styles['col']} col`}
            />
          </div>
          <div className={`${styles['row']} row`}>
            <div className={`${styles['searchTagTitle']} ${styles['col']} col`}>
              ＃關鍵字搜尋
            </div>
          </div>
          <div className={`${styles['searchTagGroup']} d-flex`}>
            <div className={`${styles['group1']} d-flex`}>
              <div className={`${styles['searchTag']} ${styles['tag1']}`}>
                <a href="http://localhost:3000/search?q=%E6%96%B0%E6%89%8B&type=products">
                  ＃新手
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag2']}`}>
                <a href="http://localhost:3000/search?q=%E6%8A%80%E5%B7%A7&type=products">
                  ＃技巧
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag3']}`}>
                <a href="http://localhost:3000/search?q=%E5%92%96%E5%95%A1%E8%B1%86&type=products">
                  ＃咖啡豆
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag4']}`}>
                <a href="http://localhost:3000/search?q=%E5%92%96%E5%95%A1%E6%A9%9F&type=products">
                  ＃咖啡機
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag5']}`}>
                <a href="http://localhost:3000/search?q=%E9%85%8D%E4%BB%B6&type=products">
                  ＃配件
                </a>
              </div>
            </div>
            <div className={`${styles['group2']} d-flex`}>
              <div className={`${styles['searchTag']} ${styles['tag6']}`}>
                <a href="http://localhost:3000/search?q=SCA&type=products">
                  ＃SCA
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag7']}`}>
                <a href="http://localhost:3000/search?q=%E9%AB%94%E9%A9%97&type=products">
                  ＃體驗
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag8']}`}>
                <a href="http://localhost:3000/search?q=LATTE%20ART&type=products">
                  ＃LATTE ART
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag9']}`}>
                <a href="http://localhost:3000/search?q=%E7%83%98%E7%84%99&type=products">
                  ＃烘焙
                </a>
              </div>
              <div className={`${styles['searchTag']} ${styles['tag10']}`}>
                <a href="http://localhost:3000/search?q=%E6%89%8B%E6%B2%96&type=products">
                  ＃手沖
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 手機板列表 animationToggle要改*/}
      <div
        className={`${styles.phone} ${animationClass} ${
          animationToggle ? 'd-block' : 'd-none'
        } p-0 `}
        // 雨妏的旋轉咖啡有到10層
        style={{ position: 'relative', zIndex: 300 }}
      >
        <Phone_menu List_switch={List_switch} />
      </div>

      {/* 加載畫面 */}
      {loading && (
        <div style={{ width: '150px' }}>
          <Loading />
        </div>
      )}
    </header>
  )
}
