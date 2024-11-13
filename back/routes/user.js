import express from 'express'
const router = express.Router()
import connection from '../db.js'
import jwt from 'jsonwebtoken' // 處理 token
import multer from 'multer' // 儲存圖片的東西
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcrypt' //密碼解析
import { v1 as uuidv1 } from 'uuid'

// email 寄信
import transporter from '#configs/mail.js'
import 'dotenv/config.js'

/* 後續新增 */

import { getIdParam } from '#db-helpers/db-tool.js' // 檢查空物件, 轉換req.params為數字
import authenticate from '#middlewares/authenticate.js'

// 對資料庫操作
import sequelize from '#configs/db.js'
const { User } = sequelize.models

/* 後續新增 結束 */

const jsonModdleware = express.json() // 接收資料的中間件

//token 金鑰
const secretKey = 'ooxxoo'

// http://localhost:3005/api/user

// 設定 multer 儲存圖片的程式碼
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('to des')

    cb(null, path.resolve('./' + '/public/images/user')) // 保存圖片的資料夾
  },
  filename: function (req, file, cb) {
    // 資料名稱在前台設置
    console.log('後臺接收檔名: ', file)
    let newName = file.originalname // 前台設定的檔名(含副檔名)
    cb(null, newName)
  },
})

const upload = multer({ storage: storage }) //儲存圖片時執行 storage

// 普通的 id 抓資料
router.post('/', jsonModdleware, (req, res) => {
  const { id, name, email } = req.body
  console.log('搜尋到的使用者 ', id, name, email) // 交易訂單

  const query = `SELECT * FROM user WHERE id = ?`

  // 使用參數化查詢來防止 SQL 注入
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    if (result.length === 0) {
      // 如果沒有資料被找到，說明沒有符合條件的記錄
      return res.status(404).json({ message: '沒有找到符合條件的記錄' })
    }

    return res.json(result) // 回傳查詢結果
  })
})

// 登入(原用戶登入)
router.post('/login', (req, res) => {
  const { account, password } = req.body // 傳送帳號密碼

  console.log(account, password)

  connection.execute(
    'SELECT * FROM `user` WHERE `account` = ?',
    [account],
    (error, results) => {
      if (error) {
        console.log(error) // 發生錯誤
        return res.status(500).json({ message: '伺服器錯誤', err: '登入錯誤' })
      }

      if (results.length === 0) {
        // 如果帳號不存在
        return res.status(404).json({ message: '查無此帳號', err: '登入錯誤' })
      }

      const user = results[0] // 有找到東西的話, 帶入 user

      // 使用 bcrypt 驗證密碼
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.log(err)
          return res
            .status(400)
            .json({ message: '伺服器錯誤', err: '登入錯誤' })
        }

        if (!isMatch) {
          // 如果帳號正確, 但密碼錯誤
          // 返回部分訊息
          let data = {
            id: user.id,
            name: user.name,
            account: user.account,
          }
          return res.status(404).json({ message: '密碼錯誤', data: data })
        }

        // 把需要用到的訊息, 用 token 打包起來
        const token = jwt.sign(
          {
            id: user.id,
            name: user.name,
            birthday: user.birthday,
            img: user.img,
            email: user.email,
            account: user.account,
            created_at: user.created_at,
            valid: user.valid,
            phone: user.phone,
            gender: user.gender,
            permissions: user.permissions,
            updated_at: user.updated_at,
          },
          secretKey,
          {
            expiresIn: '3y',
          }
        )

        // 返回狀態 200, 並把 token 傳回去
        res.status(200).json({
          status: 'success', // 給一個代稱
          token,
        })
      })
    }
  )
})

// 註冊(新增用戶)
router.post('/register', jsonModdleware, (req, res) => {
  const { name, account, password, email, phone } = req.body
  console.log('要註冊的帳號: ', name, account, password, email, phone)

  if (!name) {
    return res.status(400).json({ message: '阿你的名子勒?' })
  }

  if (!account) {
    return res.status(400).json({ message: '請輸入帳號' })
  }

  if (!password) {
    return res.status(400).json({ message: '請輸入密碼' })
  }

  if (!email) {
    return res.status(400).json({ message: '請輸入電子郵件' })
  }

  // 檢查帳號和姓名是否已經存在
  const checkQuery = 'SELECT * FROM user WHERE account = ? OR name = ?'
  connection.query(checkQuery, [account, name], (err, results) => {
    if (err) {
      console.error('搜尋帳號或姓名錯誤:', err)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    // 檢查是否有相同的帳號或姓名
    const accountExists = results.some((user) => user.account === account)
    const nameExists = results.some((user) => user.name === name)

    if (accountExists) {
      return res.status(400).json({ message: '該帳號已有人使用' })
    }

    if (nameExists) {
      return res.status(400).json({ message: '已經存在該用戶' })
    }

    // 使用 bcrypt 加密密碼
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        console.error('密碼加密錯誤:', err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      // 格式化當前時間
      const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace('T', ' ')

      // 插入新的用戶，不包括 id，讓 MySQL 自動生成
      // 預設圖片: http://localhost:3005/images/user/substitute.jpg
      const newUser = {
        id: uuidv1(),
        name,
        birthday: '(請輸入生日)',
        img: 'http://localhost:3005/images/user/substitute.jpg', // 預設圖片
        email,
        account,
        password: hashedPassword, // 使用加密後的密碼
        created_at: currentTime,
        valid: '1',
        phone,
        permissions: '0',
        gender: '(請選擇性別)',
        updated_at: currentTime, // 使用格式化後的當前時間
      }

      // console.log('註冊資料: ', newUser)

      const query = `
        INSERT INTO user 
        (id, name, birthday, img, email, account, password, created_at, valid, phone, permissions, gender, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const values = [
        newUser.id,
        newUser.name || '',
        newUser.birthday || '',
        newUser.img || ' ',
        newUser.email || '',
        newUser.account || '',
        newUser.password || '',
        newUser.created_at || '',
        newUser.valid || '',
        newUser.phone || '',
        newUser.permissions || '',
        newUser.gender || '',
        newUser.updated_at || '',
      ]

      connection.query(query, values, (err, results) => {
        if (err) {
          console.error('插入用戶錯誤:', err)
          return res.status(500).json({ message: '伺服器錯誤' })
        }

        return res.json({ message: '註冊成功', data: newUser })
      })
    })
  })
})

// 用戶資料變更(jsonModdleware 才能收到前端資料)
router.put('/updata', jsonModdleware, (req, res) => {
  let { id, name, phone, email, gender, birthday } = req.body
  // console.log('ghjkl ', id, name, phone, email, gender, birthday)

  // 更新資料庫中對應的 user 資料
  const query = `
    UPDATE user
    SET name = ?, phone = ?, email = ?, gender = ?, birthday = ? 
    WHERE id = ?
  `
  connection.query(query, [name, phone, email, gender, birthday, id], (err) => {
    if (err) {
      console.error('更新資料庫失敗:', err)
      return res.status(500).json({ message: '更新資料庫失敗' })
    }
    return res.json({ message: '更改成功' })
  })
})

// ben老師的登入狀態檢查(保留)
// router.get('/status', checkToken, (req, res) => {

//   let secretKey = 'xxx'

//   const {
//     id,
//     name,
//     birthday,
//     img,
//     email,
//     account,
//     created_at,
//     valid,
//     gender,
//     phone: user,
//     permissions,
//     updated_at,
//   } = req.decoded
//   // console.log(account, name, mail, head);

//   if (!account) {
//     res.status(400).json({
//       status: 'error',
//       message: '驗證錯誤, 請重新登入',
//     })
//     return
//   }

//   const token = jwt.sign(
//     {
//       id,
//       name,
//       birthday,
//       img,
//       email,
//       account,
//       created_at,
//       valid,
//       gender,
//       phone: user,
//       permissions,
//       updated_at,
//     },
//     secretKey,
//     {
//       expiresIn: '3y',
//     }
//   )

//   res.status(200).json({
//     status: 'success',
//     message: '使用者於登入狀態',
//     token,
//   })
// })

// 加入 google 後測試
router.get('/status', checkToken, (req, res) => {
  let secretKey = 'xxx'

  const {
    id = '',
    name = '',
    birthday = '',
    img = '',
    email = '',
    account = '',
    created_at = '',
    valid = '',
    gender = '',
    phone: user = '',
    permissions = '',
    updated_at = '',
  } = req.decoded

  // console.log(account, name, email, img);

  if (!account) {
    res.status(400).json({
      status: 'error',
      message: '驗證錯誤, 請重新登入',
    })
    return
  }

  const token = jwt.sign(
    {
      id,
      name,
      birthday,
      img,
      email,
      account,
      created_at,
      valid,
      gender,
      phone: user,
      permissions,
      updated_at,
    },
    secretKey,
    {
      expiresIn: '3y',
    }
  )

  res.status(200).json({
    status: 'success',
    message: '使用者於登入狀態',
    token,
  })
})

// ben老師的登出
router.get('/logout', checkToken, (req, res) => {
  const { account, name, mail, head } = req.body
  console.log('需要登出 ', account, name)

  let token2 = req.get('Authorization')
  token2 = token2.slice(7)

  if (!account) {
    res.status(400).json({
      status: 'fail',
      message: '登出失敗, 請稍後再試',
    })
    return
  }

  const token = jwt.sign(
    {
      id: undefined,
      name: undefined,
      birthday: undefined,
      img: undefined,
      email: undefined,
      account: undefined,
      created_at: undefined,
      valid: undefined,
      phone: undefined,
      permissions: undefined,
      updated_at: undefined,
    },
    secretKey,
    {
      expiresIn: '-3y',
    }
  )

  res.status(200).json({
    status: 'success',
    message: '登出成功',
    token,
  })
})

// ben 的 token 東西
function checkToken(req, res, next) {
  let token = req.get('Authorization')

  if (token && token.indexOf('Bearer ') === 0) {
    token = token.slice(7)
    // 類似session的作法
    // 不是很保險, 因為伺服器重啟blackList就會消失
    // if(blackList.includes(token)){
    //   return res.status(401).json({
    //     status: "error",
    //     message: "登入驗證失效, 請重新登入",
    //   });
    // }
    jwt.verify(token, secretKey, (error, decoded) => {
      if (error) {
        res.status(401).json({
          status: 'error',
          message: '登入驗證失效, 請重新登入',
        })
        return
      }
      req.decoded = decoded

      next()
    })
  } else {
    console.log('查看: ', token)
    res.status(401).json({
      status: 'error',
      message: '無驗證資料, 請重新登入',
    })
  }
}

// 使用者上傳圖片 upload.single('file')
router.post('/upload', upload.single('file'), (req, res) => {
  //console.log("後臺收到的東西 ",req.body.file); // 有找到東西
  return res.status(200).json({ message: '後台 圖片上傳成功' })
})

// 使用者優惠券
router.post('/coupon', (req, res) => {
  const { id } = req.body

  // user_coupon (pl) 和 coupon (p)
  const query = `
    SELECT p.*, pl.quantity
FROM user_coupon pl
JOIN coupon p ON pl.coupon_id = p.id
WHERE pl.user_id = ?
  `

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    if (results.length === 0) {
      // 如果結果為空，返回沒有找到符合條件的數據
      // return res.status(404).json({ message: '沒有找到符合條件的數據' })
      return res.json(results)
    }

    return res.json(results) // 回傳查詢結果
  })
})

/////////////////

// 使用者按讚測試
// 優化測試
const Like_Query = (tableName, idField, userId, res) => {
  const query = `
    SELECT c.*
    FROM ${tableName}_like cl
    JOIN ${tableName} c ON cl.${idField} = c.id
    WHERE cl.user_id = ?
  `

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    return res.json(results) // 回傳查詢結果
  })
}

// 產品按讚路由
router.post('/product_like', jsonModdleware, (req, res) => {
  const { id } = req.body
  console.log('ooxxo', id)
  Like_Query('product', 'product_id', id, res)
})

// 課程按讚路由
router.post('/course_like', (req, res) => {
  const { id } = req.body
  console.log('課程後台: ', id)
  Like_Query('course', 'course_id', id, res)
})

// 文章按讚路由
router.post('/article_like', (req, res) => {
  const { id } = req.body
  console.log('收到的 ', id)

  // 文章的 target_type 需要特別處理
  const query = `
    SELECT c.*
    FROM article_like cl
    JOIN article c ON cl.target_id = c.id
    WHERE cl.user_id = ? AND cl.target_type = 'article'
  `

  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    return res.json(results) // 回傳查詢結果
  })
})

/////////////////

//使用者增加喜歡(優化版)

// 共用的插入函數
const Like_Creation = (tableName, userId, targetId, targetType, res) => {
  let query
  let params

  if (targetType) {
    // 針對 article_like 的情況，需加入 target_type
    query = `INSERT INTO ${tableName}_like (user_id, target_id, target_type) VALUES (?, ?, ?)`
    params = [userId, targetId, targetType]
  } else {
    // 針對 product_like 和 course_like 的情況
    query = `INSERT INTO ${tableName}_like (user_id, ${tableName}_id) VALUES (?, ?)`
    params = [userId, targetId]
  }

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error('插入資料庫失敗:', err)
      return res.status(500).json({ message: '插入資料庫失敗' })
    }

    return res.json({ message: '資料插入成功', results }) // 回傳插入結果
  })
}

// 產品新增喜歡
router.post('/product_like/create', (req, res) => {
  const { id, product_id } = req.body
  console.log('post 過來的: ', id, product_id)
  Like_Creation('product', id, product_id, null, res)
})

// 課程新增喜歡
router.post('/course_like/create', (req, res) => {
  const { id, course_id } = req.body
  console.log('post 過來的: ', id, course_id)
  Like_Creation('course', id, course_id, null, res)
})

// 文章新增喜歡
router.post('/article_like/create', (req, res) => {
  const { id, article_id } = req.body
  console.log('post 過來的: ', id, article_id)
  Like_Creation('article', id, article_id, 'article', res)
})

/////////////////

/////////////////

// 使用者刪除刪除喜歡(優化版)
// http://localhost:3005/api/user/product_like/delete

// 共用的刪除函數
const Like_Deletion = (tableName, idField, userId, targetId, res) => {
  const query = `DELETE FROM ${tableName}_like WHERE user_id = ? AND ${idField} = ?`

  connection.query(query, [userId, targetId], (err, results) => {
    if (err) {
      console.error('刪除資料庫失敗:', err)
      return res.status(500).json({ message: '刪除資料庫失敗' })
    }

    if (results.affectedRows === 0) {
      // 如果沒有資料被刪除，說明可能沒有找到符合條件的記錄
      return res.status(404).json({ message: '沒有找到符合條件的記錄' })
    }

    return res.json({ message: '資料刪除成功' }) // 回傳刪除結果
  })
}

// 產品刪除喜歡
router.delete('/product_like/delete', jsonModdleware, (req, res) => {
  const { id, product_id } = req.body
  console.log('後台刪除: ', req.body)
  Like_Deletion('product', 'product_id', id, product_id, res)
})

// 課程刪除喜歡
router.delete('/course_like/delete', jsonModdleware, (req, res) => {
  const { id, course_id } = req.body
  console.log('後台刪除: ', req.body)
  Like_Deletion('course', 'course_id', id, course_id, res)
})

// 文章刪除喜歡
router.delete('/article_like/delete', jsonModdleware, (req, res) => {
  const { id, article_id } = req.body
  console.log('後台刪除: ', req.body)
  Like_Deletion('article', 'target_id', id, article_id, res)
})

/////////////////

/////////////////

// email 忘記密碼
/* 寄送email的路由 */
router.post('/email', jsonModdleware, function (req, res) {
  const { id, name, account, email } = req.body
  console.log('後端收到: ', id, name, account, email)

  const redirectUrl = `http://localhost:3000/login/recover?id=${id}&name=${encodeURIComponent(name)}&account=${encodeURIComponent(account)}` // 你的導引連結

  // 更新 mailOptions，將訊息與連結包含在信件內容中
  const mailOptions = {
    from: `"I GOT BREW"<${process.env.SMTP_TO_EMAIL}>`,
    to: 'we25317735@gmail.com',
    // to: 'happy1010505@gmail.com',
    subject: 'IGotBrew 給忘記密碼的使用者',
    text: `
      親愛的 ${name} 先生/女士,

      我們收到您重設密碼的請求。如果這是您本人發出的請求，請點擊以下連結以重設密碼：

      ${redirectUrl}

      如果您並未要求重設密碼，請忽略此信件。

      謝謝！
      IGotBrew 團隊
    // `,
    // attachments: [
    //   {
    //     filename: 'example.png', // 這裡是圖片的檔名
    //     path: './public/user/chen_cheng.jpg.jpg', // 圖片的相對路徑
    //     cid: 'example@cid', // 可選，用來在HTML內容中引用此附件
    //   },
    //   {
    //     filename: 'example.png', // 這裡是圖片的檔名
    //     path: './public/user/chen_cheng.jpg.jpg', // 圖片的相對路徑
    //     cid: 'example@cid', // 可選，用來在HTML內容中引用此附件
    //   },
    //   {
    //     filename: 'example.png', // 這裡是圖片的檔名
    //     path: './public/user/chen_cheng.jpg.jpg', // 圖片的相對路徑
    //     cid: 'example@cid', // 可選，用來在HTML內容中引用此附件
    //   },
    // ],
  }

  // 寄送
  transporter.sendMail(mailOptions, (err, response) => {
    if (err) {
      // 失敗處理
      return res.status(400).json({ status: 'error', message: err })
    } else {
      // 成功回覆的json
      return res.json({ status: 'success', data: null })
    }
  })
})

/////////////////

// 使用者訂單查詢
router.post('/order', jsonModdleware, function (req, res) {
  const { id, name } = req.body
  console.log('搜尋到的使用者 ', id, name)

  const query = `SELECT * FROM order_list WHERE user_id = ?`

  // 使用參數化查詢來防止 SQL 注入
  connection.query(query, [id], (err, results) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    if (results.length === 0) {
      // 如果沒有資料被找到，說明沒有符合條件的記錄
      return res.status(404).json({ message: '沒有找到符合條件的記錄' })
    }

    // 將結果按 create_time 排序
    // results.sort((a, b) => new Date(a.create_time) - new Date(b.create_time)) // 日期遠排到近
    results.sort((a, b) => new Date(b.create_time) - new Date(a.create_time))

    console.log('照日期排序: ', results)

    return res.json(results) // 回傳排序後的查詢結果
  })
})

// 訂單細項表
router.post('/orderDetail', jsonModdleware, function (req, res) {
  const { id, name } = req.body
  console.log('搜尋到的使用者 ', id, name) // 交易訂單

  const query = `SELECT * FROM order_detail WHERE order_id = ?`

  // 使用參數化查詢來防止 SQL 注入
  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    if (result.length === 0) {
      // 如果沒有資料被找到，說明沒有符合條件的記錄
      return res.status(404).json({ message: '沒有找到符合條件的記錄' })
    }

    return res.json(result) // 回傳查詢結果
  })
})

/* 訂單細項表 抓3張大表資料 */
router.post('/DetailALL', jsonModdleware, function (req, res) {
  const { id } = req.body
  console.log('搜尋到的訂單 ID: ', id)

  // 這部分我完全看不懂
  const query = `
  SELECT od.order_id, od.product_id, od.product_quantity, 
         p.name AS product_name, p.price AS product_price, p.img AS product_img, 
         od.course_id, od.course_quantity, 
         c.name AS course_name, c.price AS course_price, c.img_main AS course_img, 
         od.subtotal
  FROM order_detail od
  LEFT JOIN product p ON od.product_id = p.id
  LEFT JOIN course c ON od.course_id = c.id
  WHERE od.order_id = ?;
`

  connection.query(query, [id], (err, result) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    if (result.length === 0) {
      return res.status(404).json({ message: '沒有找到符合條件的記錄' })
    }

    return res.json(result)
  })
})

/////////////////

// 使用者 修改密碼
router.post('/recover', jsonModdleware, function (req, res) {
  const { user_id, text } = req.body
  console.log('搜尋到: ', user_id, text)

  const sql = `
  UPDATE user
  SET password = ?
  WHERE id = ?
`
  // 使用 bcrypt 的預設 saltRounds
  bcrypt.hash(text, 10, (err, text) => {
    if (err) {
      console.error('加密密碼失敗:', err)
      return res.status(500).json({ message: '加密密碼失敗' })
    }

    connection.query(sql, [text, user_id], (err, result) => {
      if (err) {
        console.error('查詢資料庫失敗:', err)
        return res.status(500).json({ message: '查詢資料庫失敗' })
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: '沒有找到符合條件的記錄' })
      }

      return res.json({ message: '密碼已更新' })
    })
  })
})

/////////////////

/////////////////

// google 加入user 清單
router.post('/google', jsonModdleware, (req, res) => {
  const { uid, displayName, email, photoURL } = req.body
  console.log('google的後端: ', uid, displayName, email, photoURL)

  const sql = `SELECT * FROM user WHERE email = ?`

  console.log("dfghujikolp;'")

  connection.query(sql, [email], (err, result) => {
    if (err) {
      console.error('查詢資料庫失敗:', err)
      return res.status(500).json({ message: '查詢資料庫失敗' })
    }

    if (result.length === 0) {
      // 如果沒有資料被找到，說明沒有符合條件的記錄
      // 把新的帳號丟進資料庫
      const sql2 = `
        INSERT INTO user (name, birthday, img, email, account, password, created_at, valid, phone, permissions, gender, updated_at)
        VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `

      const now = new Date() // 抓現在的日期

      // 請確保為所有需要的字段提供適當的預設值
      connection.query(
        sql2,
        [
          displayName || '', // name
          '', // birthday
          photoURL || '', // img
          email, // email
          '(Google_account)' || '', // account
          null, // password, 根據需要修改
          now, // created_at
          1, // valid
          '', // phone
          null, // permissions
          '', // gender
          now, // updated_at
        ],
        (err, result) => {
          if (err) {
            console.error('丟進資料庫失敗:', err)
            return res.status(500).json({ message: '丟進資料庫失敗' })
          }
          // console.log('資料插入成功:', result)
          return res.json({ message: '用戶已新增' })
        }
      )
    } else {
      return res.json(result) // 回傳查詢結果
    }
  })
})

// google 登入(轉換成本地居民同格式)
router.post('/googleLogin', (req, res) => {
  const { email } = req.body // 用信箱當登入的依據

  console.log('google 後端登入測試: ', email)

  connection.execute(
    'SELECT * FROM `user` WHERE `email` = ?',
    [email],
    (error, results) => {
      if (error) {
        console.log(error) // 發生錯誤
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      const user = results[0] // 有找到東西的話, 帶入 user

      /* 目前的設計是新增完資料後直接登入, 所以基本有資料 */

      // 把需要用到的訊息, 用 token 打包起來
      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          birthday: user.birthday,
          img: user.img,
          email: user.email,
          account: '(Google_account)', //假帳號, 應前端需求
          created_at: user.created_at,
          valid: user.valid,
          phone: user.phone,
          gender: user.gender,
          permissions: null, // 目前 google 帳號皆用 null 做判斷
          updated_at: user.updated_at,
        },
        secretKey,
        {
          expiresIn: '3y',
        }
      )

      // 返回狀態 200, 並把 token 傳回去
      res.status(200).json({
        status: 'success', // 給一個代稱
        token,
      })
    }
  )
})

/**
 * 後續新增
 */
// GET - 得到單筆資料(注意，有動態參數時要寫在GET區段最後面)
router.get('/:id', async function (req, res) {
  // 轉為數字
  const id = getIdParam(req)

  console.log('後端取得: ', id)

  // 檢查是否為授權會員，只有授權會員可以存取自己的資料
  // if (req.user.id !== id) {
  //   return res.json({ status: 'error', message: '存取會員資料失敗' })
  // }

  const user = await User.findByPk(id, {
    raw: true, // 只需要資料表中資料
  })

  // 不回傳密碼
  delete user.password

  // 把需要用到的訊息, 用 token 打包起來
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      birthday: user.birthday,
      img: user.img,
      email: user.email,
      account: '(Google_account)', // 假帳號, 應前端需求
      created_at: user.created_at,
      valid: user.valid,
      phone: user.phone,
      gender: user.gender,
      permissions: null, // 目前 google 帳號皆用 null 做判斷
      updated_at: user.updated_at,
    },
    secretKey,
    {
      expiresIn: '3y', // 設定 token 的有效期限
    }
  )

  // 返回狀態 200, 並把 token 傳回去
  return res.status(200).json({
    status: 'success', // 給一個代稱
    token,
  })
})

export default router
