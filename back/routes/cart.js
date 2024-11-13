import express from 'express'
import connection from '../db.js'
import moment from 'moment'
import { createLinePayClient } from 'line-pay-merchant'
import transporter from '#configs/mail.js'
import 'dotenv/config.js'
const router = express.Router()

const linePayClient = createLinePayClient({
  channelId: process.env.LINE_PAY_CHANNEL_ID,
  channelSecretKey: process.env.LINE_PAY_CHANNEL_SECRET,
  env: process.env.NODE_ENV,
})

router.get('/searchOrder', (req, res) => {
  const { orderId } = req.query
  console.log(orderId)
  connection.execute(
    `SELECT * FROM order_list WHERE id = ?`,
    [orderId],
    (error, results) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: '該用戶沒有優惠券' })
      }

      return res.status(200).json(results)
    }
  )
})
//抓商品資料
router.get('/searchproduct', (req, res) => {
  connection.execute(
    `SELECT * FROM product
ORDER BY id LIMIT 5`,
    (error, results) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: '抓取商品資料錯誤' })
      }

      return res.status(200).json(results)
    }
  )
})

//抓酷碰券
router.post('/selectcoupon', (req, res) => {
  const { user } = req.body
  if (!user.id) {
    return res.status(400).json({ message: '缺少用戶 ID' })
  }
  const query = `
    SELECT uc.user_id,uc.coupon_id,c.name AS coupon_name,c.value AS coupon_value,c.type AS coupon_type,uc.quantity FROM user_coupon uc JOIN coupon c ON uc.coupon_id = c.id WHERE uc.user_id = ?;`

  connection.execute(query, [user.id], (error, results) => {
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
// 建立訂單
router.post('/create', (req, res) => {
  let orderId = Date.now() + '-' + Math.floor(Math.random() * 1000)
  const {
    name,
    phone,
    email,
    ship_method,
    bill_type,
    total_amount,
    user_id,
    coupon_id,
    pay_type,
    cardnum,
    address,
    productItems,
    courseItems,
    store_name,
    store_id,
    foundation,
  } = req.body
  const dataTime = moment().format('YYYY-MM-DD HH:mm:ss')

  connection.beginTransaction((err) => {
    if (err) {
      console.error('開始交易失敗:', err)
      return res
        .status(500)
        .json({ message: '訂單建立失敗', error: err.message })
    }

    connection.execute(
      `INSERT INTO order_list (id, name, phone, email, ship_method, bill_type, create_time, coupon_id, cardnum, invoice_donation, pay_type, total_amount, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        name,
        phone,
        email,
        ship_method,
        bill_type,
        dataTime,
        coupon_id,
        cardnum,
        foundation,
        pay_type,
        total_amount,
        user_id,
      ],
      (err) => {
        if (err) {
          return connection.rollback(() => {
            console.error('插入訂單主表失敗:', err)
            res
              .status(500)
              .json({ message: '訂單建立失敗', error: err.message })
          })
        }
        connection.execute(
          `UPDATE user_coupon SET quantity = quantity - 1,lastedit_time = ? WHERE user_id = ? AND coupon_id = ? `,
          [dataTime, user_id, coupon_id],
          (err, result) => {
            if (err) {
              // 如果更新優惠券失敗，則回滾交易
              return connection.rollback(() => {
                console.error('更新優惠券數量失敗:', err)
                res.status(500).json({
                  message: '優惠券更新失敗',
                  error: err.message,
                })
              })
            }

            if (productItems.length > 0) {
              const productValues = productItems.map((item) => [
                orderId,
                item.id,
                item.qty,
                item.qty * item.price,
              ])

              let productInsertCount = 0

              productValues.forEach((productValue) => {
                connection.execute(
                  'INSERT INTO order_detail (order_id, product_id, product_quantity, subtotal) VALUES (?, ?, ?, ?)',
                  productValue,
                  (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        console.error('插入產品項目失敗:', err)
                        res
                          .status(500)
                          .json({ message: '訂單建立失敗', error: err.message })
                      })
                    }

                    productInsertCount++
                    if (productInsertCount === productValues.length) {
                      insertCourseItems()
                    }
                  }
                )
              })
            } else {
              insertCourseItems()
            }

            function insertCourseItems() {
              if (courseItems.length > 0) {
                const courseValues = courseItems.map((item) => [
                  orderId,
                  item.id,
                  item.qty,
                  item.qty * item.price,
                ])

                let courseInsertCount = 0

                courseValues.forEach((courseValue) => {
                  connection.execute(
                    'INSERT INTO order_detail (order_id, course_id, course_quantity, subtotal) VALUES (?, ?, ?, ?)',
                    courseValue,
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          console.error('插入課程項目失敗:', err)
                          res.status(500).json({
                            message: '訂單建立失敗',
                            error: err.message,
                          })
                        })
                      }

                      courseInsertCount++
                      if (courseInsertCount === courseValues.length) {
                        insertHomeDelivery()
                      }
                    }
                  )
                })
              } else {
                insertHomeDelivery()
              }
            }

            function insertHomeDelivery() {
              if (ship_method === '1' && address) {
                connection.execute(
                  `INSERT INTO home_delivery (order_id, address) VALUES (?, ?)`,
                  [orderId, address],
                  (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        console.error('插入宅配地址失敗:', err)
                        res
                          .status(500)
                          .json({ message: '訂單建立失敗', error: err.message })
                      })
                    }
                    commitTransaction()
                  }
                )
              } else if (ship_method === '2') {
                connection.execute(
                  `INSERT INTO seven_delivery (order_id, store_name, store_id) VALUES (?, ?, ?)`,
                  [orderId, store_name, store_id],
                  (err) => {
                    if (err) {
                      return connection.rollback(() => {
                        console.error('插入 7-11 送貨資料失敗:', err)
                        res
                          .status(500)
                          .json({ message: '訂單建立失敗', error: err.message })
                      })
                    }
                    commitTransaction()
                  }
                )
              } else {
                commitTransaction()
              }
            }

            function commitTransaction() {
              connection.commit((err) => {
                if (err) {
                  return connection.rollback(() => {
                    console.error('提交交易失敗:', err)
                    res
                      .status(500)
                      .json({ message: '訂單建立失敗', error: err.message })
                  })
                }
                if (pay_type === '1') {
                  return res
                    .status(200)
                    .json({ message: '訂單建立成功', orderId })
                } else {
                  const order = {
                    orderId: orderId,
                    currency: 'TWD',
                    amount: 1000,
                    packages: [
                      {
                        id: 'c99abc79-3b29-4f40-8851-bc618ca57857',
                        amount: 1000,
                        products: [
                          {
                            id: 1,
                            name: '測試商品1',
                            quantity: 500,
                            price: 2,
                          },
                        ],
                      },
                    ],
                    options: { display: { locale: 'zh_TW' } },
                  }

                  connection.execute(
                    `UPDATE order_list SET order_info = ? WHERE id = ?`,
                    [JSON.stringify(order), orderId],
                    (err) => {
                      if (err) {
                        return connection.rollback(() => {
                          console.error('插入Line失敗:', err)
                          res.json({ status: 'success', data: { order } })
                        })
                      }

                      res.status(200).json({
                        message: '訂單建立成功2',
                        orderId,
                        data: { order },
                      })
                      router.get('/reserve', async (req, res) => {
                        if (!req.query.orderId) {
                          return res.json({
                            status: 'error',
                            message: 'order id不存在',
                          })
                        }

                        const orderId = req.query.orderId
                        const redirectUrls = {
                          confirmUrl: process.env.REACT_REDIRECT_CONFIRM_URL,
                          cancelUrl: process.env.REACT_REDIRECT_CANCEL_URL,
                        }
                        const orderRecord = connection.query(
                          'SELECT * FROM order_list WHERE id = ?',
                          [orderId]
                        )

                        try {
                          const linePayResponse =
                            await linePayClient.request.send({
                              body: { ...order, redirectUrls },
                            })

                          const reservation = JSON.parse(JSON.stringify(order))

                          reservation.returnCode =
                            linePayResponse.body.returnCode
                          reservation.returnMessage =
                            linePayResponse.body.returnMessage
                          reservation.transactionId =
                            linePayResponse.body.info.transactionId
                          reservation.paymentAccessToken =
                            linePayResponse.body.info.paymentAccessToken

                          console.log(
                            `預計付款資料(Reservation)已建立。資料如下:`
                          )
                          console.log(reservation)

                          res.redirect(linePayResponse.body.info.paymentUrl.web)
                        } catch (e) {
                          console.log('error', e)
                        }
                      })
                    }
                  )
                }
              })
            }
          }
        )
      }
    )
  })
})

router.get('/confirm', (req, res) => {
  const transactionId = req.query.transactionId
  if (!transactionId) {
    return res.status(400).json({ message: '缺少 transactionId' })
  }

  connection.query(
    'SELECT * FROM order_list WHERE id = ?',
    [transactionId],
    (error, results) => {
      if (error) {
        console.error('查詢失敗:', error)
        return res
          .status(500)
          .json({ message: '查詢失敗', error: error.message })
      }

      console.log('查詢結果的 results:', results)

      if (!Array.isArray(results) || results.length === 0) {
        return res.status(404).json({ message: '訂單未找到' })
      }

      const orderRecord = results[0]
      console.log('獲取的訂單記錄:', orderRecord)

      if (!orderRecord.order_info) {
        return res
          .status(400)
          .json({ message: 'order_info 為 undefined 或空，無法解析 JSON' })
      }

      let order
      try {
        if (orderRecord.order_info.trim() === '') {
          throw new Error('order_info 是空字符串，無法解析 JSON')
        }
        order = JSON.parse(orderRecord.order_info)
      } catch (parseError) {
        return res.status(400).json({
          message: 'order_info 不是有效的 JSON 字符串',
          error: parseError.message,
        })
      }

      console.log('獲得訂單資料，內容如下：')
      console.log(order)

      let transaction
      try {
        transaction = JSON.parse(order.reservation)
      } catch (parseError) {
        return res.status(400).json({
          message: 'reservation 不是有效的 JSON 字符串',
          error: parseError.message,
        })
      }

      console.log('交易資料:', transaction)

      const amount = transaction.amount

      linePayClient.confirm
        .send({
          transactionId: transactionId,
          body: {
            currency: 'TWD',
            amount: amount,
          },
        })
        .then((linePayResponse) => {
          console.log('LINE Pay 回應:', linePayResponse)

          let status = 'paid'
          if (linePayResponse.body.returnCode !== '0000') {
            status = 'fail'
          }

          res.json({
            message: '交易確認成功',
            status: status,
            response: linePayResponse.body,
          })
        })
        .catch((error) => {
          console.error('處理確認交易過程中出錯:', error)
          res
            .status(500)
            .json({ message: '處理確認交易過程中出錯', error: error.message })
        })
    }
  )
})
router.post('/send', function (req, res) {
  const { orderId, formData } = req.body
  console.log(formData)
  const newName = formData.name.replace(/(?<=\p{L})\p{L}(?=\p{L})/u, 'O')
  const productItems = formData.productItems
  const courseItems = formData.courseItems

  const mailOptions = {
    from: `"I GOT BREW"<${process.env.SMTP_TO_EMAIL}>`,
    to: 'harry08270712@gmail.com',
    subject: `您的 I GOT BREW 訂單收據：${orderId}`,
    html: `
      <p>親愛的買家 ${newName} 您好，您的訂單已完成。</p>
      <p>申購的商品/課程如下：</p>
  <br>
  ${
    productItems.length !== 0
      ? `<h3>商品：</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr>
            <th text-align: center ">名稱</th>
            <th text-align: center;">數量</th>
            <th text-align: center;">單價</th>
            <th text-align: center;">總計</th>
          </tr>
        </thead>
        <tbody>
          ${productItems
            .map(
              (v) => `
            <tr>
              <td>${v.name}</td>
              <td style="text-align: center;">${v.qty}件</td>
              <td style="text-align: center;">$${v.price}</td>
              <td style="text-align: center;">$${v.qty * v.price}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
  <br>`
      : ''
  }
      ${
        courseItems.length !== 0
          ? `<h3>課程：</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr>
            <th text-align: center;">名稱</th>
            <th text-align: center;">數量</th>
            <th text-align: center;">單價</th>
            <th text-align: center;">總計</th>
          </tr>
        </thead>
        <tbody>
          ${courseItems
            .map(
              (v) => `
            <tr>
              <td>${v.name}</td>
              <td style="text-align: center;">${v.qty}件</td>
              <td style="text-align: center;">$${v.price}</td>
              <td style="text-align: center;">$${v.qty * v.price}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <br>`
          : ''
      }
      
      <br>
       <p>運送方式：${formData.ship_method == 1 ? '宅配到府' : '超商取貨'}</p>
       <p>付款方式：${formData.pay_type == 1 ? '信用卡' : 'Line Pay'}</p>
       <p>發票資訊：${formData.bill_type == 1 ? '紙本發票' : '發票捐贈'}</p>

      <p>合計： ${formData.total_amount} 元。</p>
    <br>
      <p>謝謝您的購買，祝您有個美好的一天。<p>
      <br>
      <br>
   ${
     courseItems.length !== 0
       ? `<p><strong>上課注意事項：</strong></p>
      <ul style="margin: 0; padding-left: 10px;">
      <li style="list-style-type: decimal;">請注意不要噴香水，香水的氣味可能會影響其他參與者的感官體驗，為了讓大家都能享受到最佳的課程效果，請避免使用香水。</li>
      <li style="list-style-type: decimal;">上課前請勿空腹，咖啡品嘗可能會對空腹的身體產生不適，建議在上課前適量進食，以免影響學習體驗。
      <li style="list-style-type: decimal;">如因天災等不可抗力因素停課，主辦方將主動聯繫延期或退款，若遇颱風等特殊情況，將以活動舉辦地公告的停班課標準為依據，不考量參與者所在地。</li>
      <li style="list-style-type: decimal;">請注意不要遲到，遲到超過 30 分鐘即無法入場，也無法退費，準時出席是對講師和其他學員的尊重，遲到超過 30 分鐘將無法參加課程，並且不提供退款。</li>
      <li style="list-style-type: decimal;">請提前確認交通路線，請提前查詢課程地點的交通路線，以避免因交通問題而耽誤上課時間。</li>
      <li style="list-style-type: decimal;">手機請調整為靜音模式，為了不影響他人的學習體驗，請將手機調整為靜音或震動模式，避免干擾課程進行。</li>
      </ul>
      <br>
      `
       : ''
   }
      <p><strong>貼心提醒您：</strong></p>
      <p>此為系統通知，請勿直接回信，若您對本通知內容有任何疑問，請利用以下方式聯絡 I GOT BREW：</p>
      <ul style="margin: 0; padding-left: 10px;">
      <li style="list-style-type: disc;">客服信箱: <a href="mailto:igotbrewofficial@gmail.com">igotbrewofficial@gmail.com</a></li>
      <li style="list-style-type: disc;">客服專線: (02) 3456-789 (服務時間：週一至週五，09:00~17:00；國定假日除外)</li>
      </ul>
      <br>
    `,
  }
  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err })
    } else {
      return res.json({ status: 'success', data: null })
    }
  })
})
export default router
