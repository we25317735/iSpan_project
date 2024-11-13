import React from 'react'
import styles from '@/styles/cartProductList.module.scss'
import Image from 'next/image'
import { useCart } from '@/hooks/use-cart'
import { FaMinus, FaPlus } from 'react-icons/fa'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'
import axios from 'axios'
import { useState, useEffect } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import { useRouter } from 'next/router'
import IconButton from '@mui/material/IconButton'
import Link from 'next/link'

export default function ProductCartList() {
  const {
    cartItems = [],
    handleDecrease = () => {},
    handleIncrease = () => {},
    handleRemove = () => {},
  } = useCart()

  const MySwal = withReactContent(Swal)
  const router = useRouter()
  const { pid } = router.query
  const [product, setProduct] = useState(null)

  const notifyAndRemove = (poroductName, productId) => {
    MySwal.fire({
      icon: 'warning',
      title: '確定要刪除？',
      text: '',
      confirmButtonText: '確定',
      showCancelButton: true,
      cancelButtonText: '取消',
      confirmButtonColor: '#2b4f61',
      customClass: {
        confirmButton: 'swal2-confirm-custom',
        cancelButton: 'swal2-cancel-custom',
      },
      didOpen: () => {
        const confirmBtn = document.querySelector('.swal2-confirm-custom')
        const cancelBtn = document.querySelector('.swal2-cancel-custom')

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
        Swal.fire({
          icon: 'success',
          title: '刪除成功!',
          showConfirmButton: false,
          timer: 1000,
        })

        handleRemove(productId)
      }
    })
  }

  useEffect(() => {
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

    fetchProductDetails()
  }, [pid])
  return (
    <>
      <div className={`${styles['main-left-area']}`}>
        <div className={`py-2 d-md-block d-none ${styles['main-left-title']}`}>
          <ul className={`d-md-flex d-none list-unstyled`}>
            <li className={`me-auto ms-5`}>商品</li>
            <li className={`col-md-2 d-flex justify-content-center`}>數量</li>
            <li className={`col-md-2 d-flex justify-content-center`}>單價</li>
            <li className={`col-md-2 d-flex justify-content-center`}>總計</li>
          </ul>
        </div>
        <div className={`${styles['main-left-body']}`}>
          {cartItems.map((product) => {
            return (
              <ul key={product.id} className={`list-unstyled d-flex pt-4`}>
                <li className={`me-auto ${styles['summary2']}`}>
                  <div className="d-flex gap-4">
                    <div className={`ms-3 col-2 ${styles['products-img']}`}>
                      <Image
                        src={`http://localhost:3005/images/hello/${product.img}`}
                        width={500}
                        height={500}
                        alt=""
                        className="w-100 h-100"
                      ></Image>
                    </div>
                    <div className="col-8 d-flex flex-column justify-content-evenly">
                      <Link
                        title={product.name}
                        className={`text-decoration-none ms-3 ${styles['h6']} ${styles['title']}`}
                        href={`http://localhost:3000/product/${product.id}`}
                      >
                        {product.name}
                      </Link>
                      <div>
                        <IconButton
                          aria-label="delete"
                          onClick={() => {
                            notifyAndRemove(product.name, product.id)
                          }}
                        >
                          <DeleteIcon
                            sx={{
                              fontSize: '2.4rem',
                            }}
                          />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </li>
                <li
                  className={`col-2 d-flex align-items-center justify-content-center ${styles['summary3']}`}
                >
                  <div className={`d-flex ${styles['counter-container']}`}>
                    <button
                      onClick={() => {
                        const nextQty = product.qty - 1
                        if (nextQty <= 0) {
                          notifyAndRemove(product.name, product.id)
                        } else {
                          handleDecrease(product.id)
                        }
                      }}
                      className={`btn ${styles['counter-btn']}`}
                    >
                      <FaMinus />
                    </button>
                    <div className={`${styles['counter-value']}`} id="counter">
                      {product.qty}
                    </div>
                    <button
                      onClick={() => {
                        handleIncrease(product.id)
                      }}
                      className={`btn ${styles['counter-btn']}`}
                    >
                      <FaPlus />
                    </button>
                  </div>
                </li>
                <li
                  className={`col-2 d-flex align-items-center justify-content-center ${styles['summary4']}`}
                >
                  ${product.price}
                </li>
                <li
                  className={`col-2 d-flex align-items-center justify-content-center ${styles['summary5']}`}
                >
                  ${product.price * product.qty}
                </li>
              </ul>
            )
          })}
        </div>
      </div>
    </>
  )
}
