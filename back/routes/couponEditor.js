import express from 'express'
import connection from '../db.js'
import moment from 'moment/moment.js'
const router = express.Router()

//抓所有酷碰券
router.get('/selectcoupon', (req, res) => {
  const query = `
SELECT 
    uc.user_id, 
    c.id AS coupon_id, 
    c.name AS coupon_name, 
    c.code AS coupon_code,
    c.value,
    c.type,
    uc.id AS id,
    uc.lastedit_time AS lastedit_time,
    uc.quantity AS coupon_quantity
FROM 
    user_coupon uc
INNER JOIN 
    coupon c 
ON 
    uc.coupon_id = c.id;
`
  connection.execute(query, (error, results) => {
    if (error) {
      console.error('資料庫查詢錯誤:', error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length === 0) {
      return res.status(200).json({ message: '找不到資料' })
    }

    res.status(200).json(results)
  })
})
router.post('/addCoupon', (req, res) => {
  const { user_id, coupon_id, qty } = req.body

  const checkQuery = `
    SELECT quantity FROM user_coupon WHERE user_id = ? AND coupon_id = ?
  `

  connection.execute(checkQuery, [user_id, coupon_id], (error, results) => {
    if (error) {
      console.error('資料庫查詢錯誤:', error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length > 0) {
      const currentTime = moment().format('YYYY-MM-DD HH:mm:ss')
      const updateQuery = `
        UPDATE user_coupon SET quantity = quantity + ? , lastedit_time = ? WHERE user_id = ? AND coupon_id = ?
      `
      connection.execute(
        updateQuery,
        [qty, currentTime, user_id, coupon_id],
        (error, updateResults) => {
          if (error) {
            console.error('資料庫更新錯誤:', error)
            return res.status(500).json({ message: '伺服器錯誤' })
          }
          res
            .status(200)
            .json({ message: '數量已更新', results: updateResults })
        }
      )
    } else {
      const currentTime = moment().format('YYYY-MM-DD HH:mm:ss')
      const insertQuery = `
        INSERT INTO user_coupon (user_id, coupon_id, quantity,lastedit_time) VALUES (?, ?, ?,?)
      `
      connection.execute(
        insertQuery,
        [user_id, coupon_id, qty, currentTime],
        (error, insertResults) => {
          if (error) {
            console.error('資料庫插入錯誤:', error)
            return res.status(500).json({ message: '伺服器錯誤' })
          }
          res
            .status(200)
            .json({ message: '已新增新的優惠券', results: insertResults })
        }
      )
    }
  })
})
router.get('/getCouponsByType', (req, res) => {
  const type = req.query.type
  const query = `
    SELECT *
    FROM coupon
    WHERE type = ?;
  `

  connection.execute(query, [type], (error, results) => {
    if (error) {
      console.error('資料庫查詢錯誤:', error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    res.status(200).json(results)
  })
})
router.delete('/deleteCoupon', async (req, res) => {
  const { user_id, coupon_id } = req.query

  console.log('刪除請求:', { user_id, coupon_id })

  const query = `
  DELETE FROM user_coupon WHERE user_id = ? AND coupon_id = ?
`

  connection.execute(query, [user_id, coupon_id], (error, results) => {
    if (error) {
      console.error('資料庫查詢錯誤:', error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    res.status(200).json(results)
  })
})
router.put('/updateCoupon', async (req, res) => {
  const { coupon_id, user_id, qty, id } = req.body
  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss')
  const query = `
    UPDATE user_coupon
    SET quantity = ?, coupon_id = ? , lastedit_time = ?
    WHERE user_id = ? AND id= ?
  `
  connection.execute(
    query,
    [qty, coupon_id, currentTime, user_id, id],
    (error, results) => {
      if (error) {
        console.error('資料庫查詢錯誤:', error)
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      res.status(200).json({ message: '更新成功', results })
    }
  )
})

router.get('/searchCoupon', async (req, res) => {
  const { query } = req.query
  const sql = `SELECT * FROM user_coupon WHERE user_id= ?`

  connection.execute(sql, [query], (error, results) => {
    if (error) {
      console.error('資料庫查詢錯誤:', error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    res.status(200).json({ message: '搜尋成功', results })
  })
})
export default router
