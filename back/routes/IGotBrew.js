import express from 'express'
const router = express.Router()
import connection from '../db.js'
// http://localhost:3005/api/IGotBrew

router.post('/claim-coupon', async (req, res) => {
  const { userId } = req.body // 從請求體獲取用戶ID
  const couponId = 1 // 固定優惠券ID為1
  const quantity = 1 // 固定數量為1

  try {
    // 檢查用戶是否已經領取過此優惠券
    const [existingCoupon] = await connection
      .promise()
      .query('SELECT * FROM user_coupon WHERE user_id = ? AND coupon_id = ?', [
        userId,
        couponId,
      ])

    if (existingCoupon.length > 0) {
      // 用戶已經領取過此優惠券
      return res.status(400).json({ message: '已經領取', alreadyClaimed: true })
    }

    // 用戶還沒領取過，新增記錄
    await connection
      .promise()
      .query(
        'INSERT INTO user_coupon (user_id, coupon_id, quantity) VALUES (?, ?, ?)',
        [userId, couponId, quantity]
      )

    res.status(200).json({ message: '優惠券領取成功', alreadyClaimed: false })
  } catch (error) {
    console.error('Error claiming coupon:', error)
    res.status(500).json({ message: '領取優惠券時發生錯誤' })
  }
})

// 檢查用戶是否已領取優惠券的路由
router.get('/check-coupon/:userId', async (req, res) => {
  const { userId } = req.params

  try {
    const [existingCoupon] = await connection.promise().query(
      'SELECT * FROM user_coupon WHERE user_id = ? AND coupon_id = ?',
      [userId, 1] // 假設優惠券ID為1
    )

    res.json({ alreadyClaimed: existingCoupon.length > 0 })
  } catch (error) {
    console.error('Error checking coupon:', error)
    res.status(500).json({ message: '檢查優惠券狀態時發生錯誤' })
  }
})

export default router
