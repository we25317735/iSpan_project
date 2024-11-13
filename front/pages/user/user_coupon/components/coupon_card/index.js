import React from 'react'
import styles from './assets/style/style.module.scss'

import coupon1 from './assets/img/coupon3.png'
import coupon2 from './assets/img/coupon2.png'

export default function Coupon_card(props) {
  const coupon = props.data
  return (
    <div className="col-12 col-lg-6">
      <div id={`${styles['coupon']}`} className="d-flex m-3">
        <div className={`${styles['card-img-box']}`}>
          {coupon.type === 'percent' ? (
            <img src={coupon1.src} alt="" />
          ) : (
            <img src={coupon2.src} alt="" />
          )}
        </div>
        <div className={` ${styles['card-content']} px-3 py-2`}>
          <div className="d-flex justify-content-between">
            <div className="d-flex">
              {/* 判斷折扣的 type */}
              {coupon.type === 'percent' ? (
                <p className={`${styles['discount-number']} `}>
                  <span>{coupon.value * 10}</span>折
                </p>
              ) : (
                <p
                  className={`${styles['discount-number']} d-flex align-items-end  mt-0`}
                >
                  <span>{coupon.value}</span>
                  <p className="fs-5  ms-md-3">優惠</p>
                </p>
              )}
            </div>
            {/* 張數 */}
            <div>x{coupon.quantity}</div>
          </div>

          <div className={`${styles['coupon-name']} py-sm-3`}>
            <span>可使用</span>
          </div>
          {/* <p className={`${styles['condition']}`}>
            低消 $<span>300</span>
          </p> */}
          <p className={`${styles['date']} pt-1 pt-sm-2`}>
            結束日期:
            <span>2024年 12月 31日 10:00</span>
          </p>
        </div>
      </div>
    </div>
  )
}
