import express from 'express'
import connection from '../db.js'
const router = express.Router()

// http://localhost:3005/api/TestPage

/* 
  ※ 測試時請把網頁刷新, Ctrl + S 有時不管用(尤其是 post)  

  這邊跟前台4種操作做對應, 咱會在這邊進行對資料庫的操作
  和一些邏輯的處理, 簡單來說他們就是相對單存的 API
*/

router.get('/search', (req, res) => {
  // 可以往資料庫撈資料, 或是你還想做點別的...
  connection.execute(
    // 資料庫撈資料
    'SELECT * FROM `users`',
    (error, results) => {
      if (error) {
        console.log(error) // 發生錯誤
        return res.status(500).json({ message: '伺服器錯誤' }) // return 錯誤回去
      }

      return res.status(200).json(results) // return 結果回去
    }
  )
})

router.post('/craet', (req, res) => {
  console.log(req.body) //前端傳過來的訊息
  const { msg, msg_2 } = req.body //把收到的值取出

  /* 
    取得資訊後, 以下就可以自由發揮了(找資料阿, 新增東西啥的)

  */

  // 結束後 老樣子, 前端有需求的話要把東西 return 回去
  return res.status(200).json({ message: '來自 post 傳送, 前端請接收' })
})

router.put('/updata', (req, res) => {
  /* 
    這邊跟post的操作一樣, 把需要的資訊傳過來後,
    在對資料庫(或是啥的..)進行資料比對後, 進行更改,
    結束後再把訊息 return 回前端
  */
})

router.delete('/delete', (req, res) => {
  /* 
    刪除資料, 一樣把引入的資訊拿來做對比,
    把你想要處決的東西, 在這邊處理掉
  */
})

export default router
