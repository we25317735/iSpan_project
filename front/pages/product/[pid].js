import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import axios from 'axios'
import styles from '@/styles/productDetail.module.scss'
import Image from 'next/image'
import { FaMinus, FaHeart, FaStar, FaStarHalfAlt } from 'react-icons/fa'
import { IoMdAdd } from 'react-icons/io'
import { FiMinus } from 'react-icons/fi'
import { FaAngleRight } from 'react-icons/fa6'
import Link from 'next/link'
import { FaRegStar } from 'react-icons/fa'
import { IoMdMore } from 'react-icons/io'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import Swal from 'sweetalert2'
import Loading from '@/components/Loading'
import { TbBorderRadius } from 'react-icons/tb'
import { FaAngleUp } from 'react-icons/fa'
import { useCart } from '@/hooks/use-cart'
export default function ProductDetail() {
  const { user } = useContext(AuthContext) // 抓使用者資訊
  const [product, setProduct] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const router = useRouter()
  const { pid } = router.query
  const [categoryId, setCategoryId] = useState('')
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [favorites, setFavorites] = useState({})
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editedComment, setEditedComment] = useState('')
  const [editedRating, setEditedRating] = useState(0)
  const [showMenuForCommentId, setShowMenuForCommentId] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowButton(true)
      } else {
        setShowButton(false)
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleEditComment = async (commentId) => {
    try {
      const response = await fetch(
        `http://localhost:3005/api/product/comment/${commentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            score: editedRating,
            comment: editedComment,
          }),
        }
      )

      if (response.ok) {
        fetchProductDetails()
        setEditingCommentId(null)
      } else {
        console.error('Failed to edit comment')
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      const response = await fetch(
        `http://localhost:3005/api/product/comment/${commentId}`,
        {
          method: 'DELETE',
        }
      )

      if (response.ok) {
        fetchProductDetails()
      } else {
        console.error('Failed to delete comment')
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    }
  }
  const handleAddComment = async () => {
    try {
      const responsey = await fetch(
        `http://localhost:3005/api/product/${product.id}/comment?user_id=${user.id}`,
        {
          method: 'GET',
        }
      )

      if (responsey.ok) {
        const existingComment = await responsey.json()
        if (existingComment) {
          Swal.fire({
            title: '已經留言過了唷',
            icon: 'warning',
            confirmButtonColor: '#3085d6',
            confirmButtonText: '確認',
          })
          return
        }
      } else {
        console.error('Failed to check existing comment')
      }

      const response = await fetch(
        'http://localhost:3005/api/product/comment',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
            product_id: product.id,
            score: newRating,
            comment: newComment,
          }),
        }
      )

      if (response.ok) {
        // 重新獲取評論
        fetchProductDetails()
        setNewComment('')
        setNewRating(0)
      } else {
        console.error('Failed to add comment')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // 加入購物車
  const cartHook = useCart()

  const handleAdd = (productWithQty) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      img: product.img,
      price: Math.floor(product.price * product.discount),
      qty: quantity,
    }
    const cart = JSON.parse(localStorage.getItem('Productcart')) || []

    const existingProductIndex = cart.findIndex(
      (item) => item.id === productWithQty.id
    )

    if (existingProductIndex > -1) {
      cart[existingProductIndex].qty += productWithQty.qty
    } else {
      cart.push(cartItem)
    }

    localStorage.setItem('Productcart', JSON.stringify(cart))
    Swal.fire({
      title: '已加入購物車',
      icon: 'success',
      position: 'top',
      showConfirmButton: false,
      timer: 1000,
      toast: true,
      color: '#1b3947',
    })
    localStorage.setItem('Productcart', JSON.stringify(cart))
    // useCart
    cartHook.handleAdd(cartItem)
  }

  const addToCart = () => {
    handleAdd({ ...product, qty: quantity })
  }
  useEffect(() => {
    setIsLoggedIn(!!user?.id)
  }, [user])
  useEffect(() => {
    if (pid) {
      fetchProductDetails()
      fetchFavorites()
    }
  }, [pid])
  const fetchFavorites = async () => {
    if (!user) return
    try {
      const response = await fetch(
        `http://localhost:3005/api/product/favorites/${user.id}`
      )
      const data = await response.json()
      if (data.status === 'success') {
        const favMap = {}
        data.favorites.forEach((fav) => {
          favMap[fav.product_id] = true
        })
        setFavorites(favMap)
      }
    } catch (error) {
      console.error('Error fetching favorites:', error)
    }
  }
  const toggleFavorite = async (productId) => {
    if (!user) {
      Swal.fire({
        title: '請先登入',
        icon: 'warning',
        confirmButtonColor: '#3085d6',
        confirmButtonText: '確認',
      })
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
  const fetchProductDetails = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3005/api/product/${pid}`
      )
      setProduct(response.data.data)
    } catch (error) {
      console.error('Error fetching product details:', error)
    }
  }

  const handleDetailClick = () => {
    router.reload() // 重新加载当前页面
  }
  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }
  return (
    <>
      <div className={`container-fluid ${styles.backg} mt-3 p-0`}>
        <Header />
        <div className={`container ${styles.one} mt-5`}>
          <div className={`${styles['bread']}`}>
            <div className={`${styles['innerBread']}`}>
              <Link href="/IGotBrew">首頁</Link>
              <FaAngleRight />
            </div>
            <div className={`${styles['innerBread']}`}>
              <Link href="/IGotBrew">線上商店</Link>
              <FaAngleRight />
            </div>
            <div className={`${styles['innerBread']}`}>
              <Link href="/product">商品總覽</Link>
              <FaAngleRight />
            </div>
            <div className={`${styles['innerBread']} ${styles['breadThis']}`}>
              <Link href="#" onClick={handleDetailClick}>
                <p className={`m-0`}>商品細節</p>
              </Link>
            </div>
          </div>
        </div>

        <div className={`container ${styles.two}`}>
          <div className={`${styles['product-card']}`}>
            <Image
              src={`http://localhost:3005/images/hello/${product.img}`}
              alt={product.name}
              width={500}
              height={500}
              onError={(e) => {
                e.target.src = 'http://localhost:3005/images/hello/bd-8.webp'
              }}
            />
            <div className={`${styles['product-card-right']}`}>
              <div className={`${styles['right-top']}`}>
                <div className={`${styles['right-title']}`}>{product.name}</div>
                <div
                  className={`${styles['right-content']}`}
                  style={{ whiteSpace: 'pre-wrap' }}
                >
                  {(product.content || '').replace(/rn/g, '\n')}
                </div>
              </div>

              <div className={`${styles['right-down']}`}>
                <div className={`${styles['left']}`}>
                  <div className={`${styles['price-heart']}`}>
                    <div className={`${styles['price']}`}>
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
                  <div className={`${styles['count-product']}`}>
                    <button
                      className={`${styles['reduce']}`}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <FiMinus className={`${styles['add-amount']}`} />
                    </button>
                    <p>{quantity}</p>
                    <button
                      className={`${styles['add']}`}
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <IoMdAdd className={`${styles['add-amount']}`} />
                    </button>
                  </div>
                </div>
                <div className={`${styles['product-down-right']}`}>
                  <button
                    className={`${styles.straight} ${styles['down-button']}`}
                  >
                    <p className={`m-0`}>直接結帳</p>
                  </button>
                  <button
                    className={`${styles['add-cart']} ${styles['down-button']}`}
                    onClick={addToCart}
                  >
                    <p className={`m-0`}>加入購物車</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {product.detailImgs.length > 0 && (
          <div className={`container`}>
            <div className={`${styles['three']}`}>
              <p className={`${styles['title']}`}>商品詳情</p>
              {product.detailImgs.map((img, index) => (
                <Image
                  key={index}
                  src={`http://localhost:3005/images/detail-img/${img}`}
                  alt={`Detail ${index + 1}`}
                  width={500}
                  height={500}
                />
              ))}
            </div>
          </div>
        )}

        {[
          { title: '內容物', content: product.weight },
          { title: '原產地', content: product.origin },
          { title: '保存期限', content: product.life },
          { title: '廠商名稱', content: product.trade },
        ].filter((item) => item.content).length > 0 && (
          <div className={`container`}>
            <div className={`${styles['three-s']}`}>
              <p className={`${styles['title']}`}>規格詳情</p>
              <div className={`${styles['formaty']} d-flex`}>
                {[
                  { title: '內容物', content: product.weight },
                  { title: '原產地', content: product.origin },
                  { title: '保存期限', content: product.life },
                  { title: '廠商名稱', content: product.trade },
                ]
                  .filter((item) => item.content)
                  .map((item, index) => (
                    <div
                      className={`${styles['formaty-list']} d-flex`}
                      key={index}
                    >
                      <p className={`${styles['formaty-title']}`}>
                        {item.title}
                      </p>
                      <p className={`${styles['formaty-content']}`}>
                        {item.content}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className={`${styles['four']} container`}>
          <div className={`${styles['rankstar-div']} d-flex`}>
            <div className={`${styles['rank-top']} d-flex`}>
              <p>
                {typeof product.average_score === 'number'
                  ? product.average_score.toFixed(1)
                  : parseFloat(product.average_score || 0).toFixed(1)}
              </p>
              <div className={`${styles['stars']}`}>
                {[...Array(5)].map((_, index) => {
                  const score = product.average_score
                  if (score >= index + 1) {
                    return (
                      <FaStar
                        key={index}
                        className={`${styles['yellow-star']}`}
                      />
                    )
                  } else if (score > index && score < index + 1) {
                    return (
                      <FaStarHalfAlt
                        key={index}
                        className={`${styles['yellow-star']}`}
                      />
                    )
                  } else {
                    return (
                      <FaRegStar
                        key={index}
                        className={`${styles['gray-star']}`}
                      />
                    )
                  }
                })}
              </div>
            </div>
            <div className={`${styles['rank-middle']}`}>
              共{product.review_count}則評價
            </div>
            {product.review_count !== 0 && (
              <div className={`${styles['rank-bottom']}`}>
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = product.comments.filter(
                    (comment) => Math.round(comment.score) === rating
                  ).length
                  //篩選出所有評分四捨五入後= 此行分數的評論數量

                  const percentage = (count / product.review_count) * 100
                  //某個評分等級的評論數量佔總評論數量的百分比
                  return (
                    <div className={`${styles['bottom-detail']}`} key={rating}>
                      <p>{rating}.0</p>
                      <FaStar />
                      <div
                        className={`${styles.percent} ${
                          percentage === 0 ? styles.gray : ''
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                      <p>{percentage.toFixed(0)}%</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className={`${styles['commenter']}`}>
            <div className={`${styles['four-title']} d-flex mb-5`}>
              <p className={`${styles['title']}`}>最新評價</p>
            </div>
            <div className={`${styles['comments']}`}>
              {product.comments.length > 0 ? (
                product.comments.map((comment, index) => (
                  <div
                    className={`d-flex ${styles['inner-comment']} `}
                    key={index}
                  >
                    <div className={`${styles['comment-top']} d-flex`}>
                      <div className={`${styles['avatar']}`}>
                        <Image
                          src={
                            comment.user_img !== 'none'
                              ? `http://localhost:3005/images/user/${comment.user_img}`
                              : 'http://localhost:3005/images/detail-img/defaultUser.jpg'
                          }
                          alt="Avatar"
                          width={50}
                          height={50}
                          className={`${styles['avatarImg']}`}
                        />
                      </div>
                      <p className={`${styles['comment-name']}`}>
                        {comment.user_name || '王小明'}
                      </p>

                      {editingCommentId === comment.id ? (
                        <div
                          className={`${styles['comment-stars']} d-flex gap-1`}
                        >
                          {[...Array(5)].map((_, index) => {
                            const ratingValue = index + 1
                            return (
                              <FaStar
                                key={index}
                                className={`${styles['starrr']}`}
                                style={{ fontSize: '15px', cursor: 'pointer' }}
                                color={
                                  ratingValue <= editedRating
                                    ? '#ffc107'
                                    : '#e4e5e9'
                                }
                                onClick={() => setEditedRating(ratingValue)}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        <div
                          className={`${styles['comment-stars']} d-flex gap-1 ms-3`}
                        >
                          {[...Array(5)].map((_, i) => (
                            <FaStar
                              key={i}
                              className={`${styles['yellow-star']}`}
                              style={{
                                color:
                                  i < Math.round(comment.score)
                                    ? '#eba92a'
                                    : '#D3D3D3',
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {editingCommentId === comment.id ? (
                        ''
                      ) : (
                        <p className={`${styles['comment-time']} ms-3`}>
                          {new Date(comment.formatted_date).toLocaleDateString(
                            'zh-TW'
                          )}
                        </p>
                      )}

                      {comment.user_id === user?.id && (
                        <div className={styles['comment-actions']}>
                          <IoMdMore
                            onClick={() => {
                              showMenuForCommentId !== comment.id
                                ? setShowMenuForCommentId(comment.id)
                                : setShowMenuForCommentId(null)
                            }}
                            className={styles['threep']}
                          />
                          {showMenuForCommentId === comment.id && (
                            <div className={styles['comment-action-menu']}>
                              <button
                                onClick={() => {
                                  setEditedComment(comment.comment)
                                  setEditedRating(comment.score)
                                  setEditingCommentId(comment.id)
                                  setShowMenuForCommentId(null)
                                }}
                              >
                                編輯
                              </button>
                              <button
                                onClick={() => {
                                  Swal.fire({
                                    title: '確認刪除留言與評分？',
                                    icon: 'warning',
                                    showCancelButton: true,
                                    confirmButtonColor: '#d33',
                                    cancelButtonColor: '#d2d2d2',
                                    confirmButtonText: '確認',
                                    cancelButtonText: '取消',
                                    customClass: {
                                      confirmButton: 'swal2-confirm-custom',
                                      cancelButton: 'swal2-cancel-custom',
                                    },
                                    didOpen: () => {
                                      const confirmBtn = document.querySelector(
                                        '.swal2-confirm-custom'
                                      )
                                      const cancelBtn = document.querySelector(
                                        '.swal2-cancel-custom'
                                      )

                                      if (confirmBtn) {
                                        confirmBtn.style.fontSize = '16px'
                                        confirmBtn.style.padding = '7px 18px'
                                      }

                                      if (cancelBtn) {
                                        cancelBtn.style.fontSize = '16px'
                                        cancelBtn.style.padding = '7px 18px'
                                      }
                                    },
                                  }).then((result) => {
                                    if (result.isConfirmed) {
                                      setEditingCommentId(comment.id)
                                      handleDeleteComment(comment.id)
                                      setShowMenuForCommentId(null)
                                    }
                                  })
                                }}
                              >
                                刪除
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment.id ? (
                      <div>
                        <textarea
                          className={styles['editable-textarea']}
                          value={editedComment}
                          onChange={(e) => setEditedComment(e.target.value)}
                        />
                        <div className={styles['button-container']}>
                          <button
                            onClick={() => {
                              if (editedRating === 0) {
                                Swal.fire({
                                  title: '請選擇評分星星數',
                                  icon: 'warning',
                                  confirmButtonColor: '#3085d6',
                                  confirmButtonText: '確認',
                                })
                              } else {
                                handleEditComment(comment.id)
                              }
                            }}
                            className={`${styles['origin-button']}`}
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className={`${styles['another-button']}`}
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className={`${styles['comment-bottom']}`}>
                        {comment.comment || '尚未輸入評論'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className={`${styles['no-comments']}`}>暫無評論</p>
              )}
              {!isLoggedIn ? (
                <div className={`${styles['login-message']}`}>
                  請登入後再留言
                </div>
              ) : (
                <div className={`d-flex border-0 ${styles['inner-comment']}`}>
                  <div className={`d-flex ${styles['comment-top']}`}>
                    <div className={`${styles['avatar']}`}>
                      <Image
                        src={
                          user
                            ? `http://localhost:3005/images/user/${user.img}`
                            : 'http://localhost:3005/images/detail-img/avatar.png'
                        }
                        alt="Avatar"
                        width={50}
                        height={50}
                        className={`${styles['avatarImg']}`}
                      />
                    </div>
                    <input
                      className={`d-flex ${styles['enter-comment']}`}
                      placeholder="留言......"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />

                    <div className={`d-flex ${styles['enter-rank']}`}>
                      <div
                        className={`${styles['comment-stars']} d-flex gap-1`}
                      >
                        {[...Array(5)].map((_, index) => {
                          const ratingValue = index + 1
                          return (
                            <FaStar
                              key={index}
                              className={`${styles['starrr']}`}
                              color={
                                ratingValue <= newRating ? '#ffc107' : '#e4e5e9'
                              }
                              onClick={() => setNewRating(ratingValue)}
                            />
                          )
                        })}
                      </div>
                      <button
                        onClick={() => {
                          if (newRating === 0) {
                            Swal.fire({
                              title: '請選擇評分星星數',
                              icon: 'warning',
                              confirmButtonColor: '#3085d6',
                              confirmButtonText: '確認',
                            })
                          } else {
                            handleAddComment()
                          }
                        }}
                      >
                        評論
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`container ${styles.five}`}>
          <div className={`${styles['four-title']} d-flex`}>
            <p className={`${styles['title']}`}>相關商品</p>
          </div>
          <div className={`row gx-4 ${styles['my-row']}`}>
            {product.relatedProducts.map((relatedProduct, index) => (
              <div
                className={`col-6 col-md-4 col-lg-3 ${styles['my-col']}`}
                key={index}
              >
                <a
                  className={`${styles['overview-card']}`}
                  href={`/product/${relatedProduct.id}`}
                >
                  <Image
                    src={`http://localhost:3005/images/hello/${relatedProduct.img}`}
                    alt={relatedProduct.name}
                    width={500}
                    height={500}
                  />
                  <div className={`${styles['overview-down']}`}>
                    <p className={`${styles['overview-title']}`}>
                      {relatedProduct.name}
                    </p>
                    <div className={`${styles['overview-bottom']}`}>
                      <p className={`${styles['overview-price']}`}>
                        <div
                          className={`${styles['front-price']} ${
                            relatedProduct.discount !== 1
                              ? styles['has-discount']
                              : ''
                          }`}
                        >
                          ${relatedProduct.price}
                        </div>
                        {relatedProduct.discount !== 1 && (
                          <div className={`${styles['off-price']}`}>
                            $
                            {(
                              relatedProduct.price * relatedProduct.discount
                            ).toFixed(0)}
                            {/* 價格為無條件捨取 */}
                          </div>
                        )}
                      </p>
                      <button className={`${styles['heart-btn']}`}>
                        <FaHeart
                          className={`${styles['heart']} ${
                            favorites[relatedProduct.id] ? styles['active'] : ''
                          }`}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleFavorite(relatedProduct.id)
                          }}
                        />
                      </button>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </div>

        <Footer />

        {showButton && (
          <button onClick={scrollToTop} className={`${styles.gototop} btn`}>
            <FaAngleUp />
            <br /> Top
          </button>
        )}
      </div>
    </>
  )
}
