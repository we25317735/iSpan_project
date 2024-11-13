import express from 'express'
import connection from '../db.js'
import multer from 'multer'
import sequelize from '#configs/db.js'
import fs from 'fs'
import path from 'path'

// import Course from '##/models/Course.js'

const router = express.Router()

const { Course, Course_like, Course_reviews } = sequelize.models

//圖片上傳
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/course')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(
      null,
      file.fieldname +
        '-' +
        uniqueSuffix +
        '.' +
        file.originalname.split('.').pop()
    )
  },
})
const upload = multer({ storage: storage })
//生成編號
function generateCourseNumber() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'

  //英文部分
  const randomLetters =
    letters.charAt(Math.floor(Math.random() * letters.length)) +
    letters.charAt(Math.floor(Math.random() * letters.length))

  // 數字部分
  const randomNumbers = Array.from(
    { length: 6 + Math.floor(Math.random() * 3) },
    () => numbers.charAt(Math.floor(Math.random() * numbers.length))
  ).join('')

  return randomLetters + randomNumbers
}

// http://localhost:3005/api/course

//獲取課程總表資訊
router.get('/', (req, res) => {
  const { tagId } = req.query

  let sqlQuery = `
    SELECT course.*, 
           tag1.tagname as tag1_name,
           tag2.tagname as tag2_name, 
           teachers.name as course_teacher 
    FROM course
    JOIN coursetags as tag1 ON course.tag1 = tag1.id
    JOIN coursetags as tag2 ON course.tag2 = tag2.id
    JOIN teachers ON teachers.id = course.teacher_id
     WHERE course.valid = 1
  `

  if (tagId && tagId !== 'all') {
    sqlQuery += `AND course.tag1 = ? OR course.tag2 = ?`
  }

  connection.execute(
    sqlQuery,
    tagId && tagId !== 'all' ? [tagId, tagId] : [],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }
      return res.status(200).json(results)
    }
  )
})
//獲取地點相關資訊
router.get('/locations', (req, res) => {
  connection.execute('SELECT * FROM course_location', (err, results) => {
    if (err) {
      console.error('SQL Error:', err.message)
      return res
        .status(500)
        .json({ message: '獲取位置失敗', error: err.message })
    }
    return res.status(200).json(results)
  })
})

// 獲取課程排程資訊，並將過期的課程排程設為無效
router.get('/schedule', (req, res) => {
  const today = new Date().toISOString().split('T')[0] // 取得今天的日期

  // 先更新所有早於或等於今天日期的課程排程為無效
  connection.execute(
    `UPDATE course_schedule 
     SET valid = 0 
     WHERE end_date <= ? AND valid = 1`,
    [today],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      // 更新成功後，再查詢所有有效的課程排程
      connection.execute(
        `SELECT course_schedule.*, course.name as course_name, 
                course_location.area as course_area, 
                course_location.location as course_location 
         FROM course_schedule
         JOIN course ON course.id = course_schedule.course_id
         JOIN course_location ON course_location.id = course_schedule.location_id
         WHERE course.valid = 1 AND course_schedule.valid = 1`,
        (err, results) => {
          if (err) {
            console.error(err)
            return res.status(500).json({ message: '伺服器錯誤' })
          }
          return res.status(200).json(results)
        }
      )
    }
  )
})
//獲取課程排程資訊（後台用）
router.get('/schedules', (req, res) => {
  connection.execute(
    `SELECT course_schedule.*, course.name as course_name 
     , course_location.area as course_area, course_location.location as course_location FROM course_schedule
     JOIN course ON course.id = course_schedule.course_id
     JOIN course_location ON course_location.id=course_schedule.location_id
     `,
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }
      return res.status(200).json(results)
    }
  )
})
//課程類別
router.get('/coursetags', (req, res) => {
  connection.execute(`SELECT * FROM coursetags`, (err, results) => {
    if (err) {
      console.error('SQL Error:', err.message)
      return res
        .status(500)
        .json({ message: '獲取類別失敗', error: err.message })
    }
    return res.status(200).json(results)
  })
})
//課程老師
router.get('/teachers', (req, res) => {
  connection.execute(`SELECT * FROM teachers`, (err, results) => {
    if (err) {
      console.error('SQL Error:', err.message)
      return res
        .status(500)
        .json({ message: '獲取老師失敗', error: err.message })
    }
    return res.status(200).json(results)
  })
})

//查詢課程
router.get('/search', (req, res) => {
  const { keywords } = req.query
  connection.execute(
    `SELECT course.*,
            tag1.tagname as tag1_name,
            tag2.tagname as tag2_name,
            teachers.name as course_teacher
     FROM course
     JOIN coursetags as tag1 ON course.tag1 = tag1.id
     JOIN coursetags as tag2 ON course.tag2 = tag2.id
     JOIN teachers ON teachers.id = course.teacher_id
     WHERE course.name LIKE ?  ORDER BY course.id ASC`,
    [`%${keywords}%`],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }
      if (results.length == 0) {
        return res.status(404).json({ message: '未搜尋到相關課程' })
      }
      return res.status(200).json({
        message: '找尋到相關課程',
        status: 'success',
        data: {
          course: results,
        },
      })
    }
  )
})
//課程詳細頁
router.get('/:id', (req, res) => {
  const { id } = req.params
  connection.execute(
    `SELECT course.*, 
            tag1.tagname as tag1_name, 
            tag2.tagname as tag2_name, 
            teachers.name as course_teacher 
     FROM course
     JOIN coursetags as tag1 ON course.tag1 = tag1.id
     JOIN coursetags as tag2 ON course.tag2 = tag2.id
     JOIN teachers ON teachers.id = course.teacher_id
     WHERE course.id = ?`,
    [id],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      // 檢查是否找到相應的課程
      if (results.length === 0) {
        return res.status(404).json({ message: '沒有找到相應的課程' })
      }

      return res.status(200).json({
        message: '找尋到相關課程',
        status: 'success',
        data: {
          course: results,
        },
      })
    }
  )
})

// 獲取所有評論
router.get('/reviews/:courseId', (req, res) => {
  const { courseId } = req.params
  connection.execute(
    `SELECT course_reviews.*, user.name as user_name, user.img as user_img FROM course_reviews 
    LEFT JOIN user ON user.id=course_reviews.user_id WHERE course_reviews.course_id = ?`,
    [courseId],
    (err, results) => {
      if (err) {
        console.error('SQL Error:', err.message)
        return res
          .status(500)
          .json({ message: '獲取評論失敗', error: err.message })
      }
      results.forEach((review) => {
        // console.log(
        //   `User Name: ${review.user_name}, User Image: ${review.user_img}`
        // )
      })
      //console.log('評論查詢結果:', results) // 打印查詢結果
      return res.status(200).json({
        message: '評論獲取成功',
        reviews: results,
      })
    }
  )
})
//新增課程
router.post(
  '/createCourse',
  upload.fields([
    { name: 'img_main', maxCount: 1 },
    { name: 'img_1', maxCount: 1 },
    { name: 'img_2', maxCount: 1 },
    { name: 'img_3', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log('Request body:', req.body) // 用於調試，確保數據正確傳遞
      const {
        name,
        tag1,
        tag2,
        teacher_id,
        content,
        price,
        sold = 0,
        valid = 1,
      } = req.body

      // 獲取上傳的文件名稱
      const getFileName = (fileArray) => {
        return fileArray && fileArray.length > 0 ? fileArray[0].filename : null
      }

      const img_main = getFileName(req.files['img_main'])
      const img_1 = getFileName(req.files['img_1'])
      const img_2 = getFileName(req.files['img_2'])
      const img_3 = getFileName(req.files['img_3'])

      // 檢查是否至少上傳了一張圖片
      if (!img_main && !img_1 && !img_2 && !img_3) {
        return res.status(400).json({ message: '至少需要上傳一張圖片' })
      }

      // 使用 Sequelize 插入新課程
      const newCourse = await Course.create({
        number: generateCourseNumber(),
        name,
        tag1,
        tag2,
        teacher_id,
        content,
        price,
        sold,
        img_main,
        img_1,
        img_2,
        img_3,
        valid,
      })

      res.status(201).json({
        status: 'success',
        data: {
          course: newCourse,
        },
      })
    } catch (error) {
      console.error('Database insertion error:', error)
      res.status(500).json({ message: '伺服器錯誤' })
    }
  }
)

// if (err) {
//   console.error(err)
//   return res
//     .status(500)
//     .json({ message: '課程新增失敗', error: err.sqlMessage || err })
// } else if (!img_1 && !img_2 && !img_3) {
//   return res.status(400).json({ message: '至少需要上傳一張圖片' })
// }
// return res.status(200).json({
//   message: '課程已新增',
//   status: 'success',
//   id: results.insertId,
//   data: {
//     results,
//   },
// })

//新增課程排程
router.post('/createSchedule', async (req, res) => {
  const {
    course_id,
    location_id,
    start_date,
    end_date,
    start_time,
    end_time,
    quota,
    valid = 1,
  } = req.body

  connection.execute(
    'INSERT INTO `course_schedule`(course_id, location_id, start_date, end_date, start_time, end_time, quota, valid) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?)',
    [
      course_id || null,
      location_id || null,
      start_date || null,
      end_date || null,
      start_time || null,
      end_time || null,
      quota || null,
      valid,
    ],
    (err, results) => {
      if (err) {
        console.error('SQL Error:', err.message, err.code, err.stack)
        return res
          .status(500)
          .json({ message: '課程排程新增失敗', error: err.message })
      }
      return res
        .status(201)
        .json({ message: '已新增課程排程', id: results.insertId })
    }
  )
})

//修改課程
router.put(
  '/updateCourse/:id',
  upload.fields([
    { name: 'img_main', maxCount: 1 },
    { name: 'img_1', maxCount: 1 },
    { name: 'img_2', maxCount: 1 },
    { name: 'img_3', maxCount: 1 },
  ]),
  async (req, res) => {
    const { id } = req.params
    const {
      name,
      tag1,
      tag2,
      teacher_id,
      content,
      price,
      valid,
      imgsToDelete = [],
    } = req.body

    try {
      const [currentCourse] = await connection
        .promise()
        .query(
          'SELECT img_main, img_1, img_2, img_3 FROM course WHERE id = ?',
          [id]
        )

      const currentImages = currentCourse[0]

      // 處理圖片字段的更新邏輯
      const getFileName = (fieldName) => {
        if (req.files[fieldName] && req.files[fieldName].length > 0) {
          return req.files[fieldName][0].filename
        }
        return null // 確保如果沒有新文件上傳，該字段為空
      }

      // 清空已刪除的圖片字段
      const clearDeletedFields = (fieldName) => {
        if (imgsToDelete.includes(fieldName)) {
          return null
        }
        return currentImages[fieldName]
      }

      // 更新圖片字段，優先使用新上傳的圖片，否則使用現有的圖片
      const img_main = getFileName('img_main') || currentImages.img_main
      const img_1 = getFileName('img_1') || clearDeletedFields('img_1')
      const img_2 = getFileName('img_2') || clearDeletedFields('img_2')
      const img_3 = getFileName('img_3') || clearDeletedFields('img_3')

      const updateQuery = `
        UPDATE course 
        SET 
          name = ?, 
          tag1 = ?, 
          tag2 = ?, 
          teacher_id = ?, 
          content = ?, 
          price = ?, 
          valid = ?,
          img_main = ?, 
          img_1 = ?, 
          img_2 = ?, 
          img_3 = ?
        WHERE id = ?
      `

      const updateValues = [
        name,
        tag1,
        tag2,
        teacher_id,
        content,
        price,
        valid,
        img_main,
        img_1,
        img_2,
        img_3,
        id,
      ]

      const [results] = await connection
        .promise()
        .execute(updateQuery, updateValues)

      console.log('SQL 結果:', results)
      return res.status(200).json({
        message: '課程已更新',
        status: 'success',
        data: { results },
      })
    } catch (err) {
      console.error('SQL 錯誤:', err)
      return res.status(500).json({ message: '伺服器錯誤', error: err.message })
    }
  }
)
// 刪除課程圖片
router.put('/deleteCourseImage/:id', async (req, res) => {
  const { id } = req.params
  const { imageField } = req.body

  try {
    const [currentCourse] = await connection
      .promise()
      .query('SELECT img_1, img_2, img_3 FROM course WHERE id = ?', [id])

    if (currentCourse.length === 0) {
      return res.status(404).json({ message: '找不到課程' })
    }

    const imagePath = currentCourse[0][imageField]
    if (imagePath) {
      const fullPath = path.join('public/images/course', imagePath)
      await fs.promises
        .unlink(fullPath)
        .catch((err) => console.log('刪除圖片失敗: ', err))
    }

    const updateQuery = `UPDATE course SET ${imageField} = NULL WHERE id = ?`
    await connection.promise().execute(updateQuery, [id])

    res.json({ status: 'success', message: '圖片已刪除' })
  } catch (error) {
    console.error('刪除圖片錯誤:', error)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})
// 修改課程排程
router.put('/updateSchedule/:id', (req, res) => {
  const { id } = req.params
  const {
    course_id,
    location_id,
    start_date,
    end_date,
    start_time,
    end_time,
    quota,
    valid,
  } = req.body

  connection.execute(
    `UPDATE course_schedule 
     SET course_id = ?, location_id = ?, start_date = ?, end_date = ?, start_time = ?, end_time = ?, quota = ?, valid = ? 
     WHERE id = ?`,
    [
      course_id,
      location_id,
      start_date,
      end_date,
      start_time,
      end_time,
      quota,
      valid,
      id,
    ],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }
      return res.status(200).json({
        message: '課程排程已更新',
        stauts: 'success',
        data: {
          results,
        },
      })
    }
  )
})

// 刪除課程
router.delete('/deleteCourse/:id', (req, res) => {
  const { id } = req.params

  connection.execute(
    'DELETE FROM `course` WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }
      return res.status(200).json({ message: '課程已刪除' })
    }
  )
})
// 刪除課程排程
router.delete('/deleteSchedule/:id', (req, res) => {
  const { id } = req.params
  console.log('Deleting schedule with ID:', id)
  connection.execute(
    'DELETE FROM course_schedule WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error('Database error:', err)
        return res
          .status(500)
          .json({ message: '伺服器錯誤', error: err.message })
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: '找不到要刪除的排程' })
      }
      console.log('Successfully deleted schedule with id:', id)
      return res.status(200).json({ message: '課程排程已刪除' })
    }
  )
})
//收藏與取消收藏
router.post('/favorite', async (req, res) => {
  const { user_id, course_id } = req.body

  if (!user_id || !course_id) {
    return res.status(400).json({ message: '需要用戶及課程id' })
  }

  try {
    const existingLike = await Course_like.findOne({
      where: {
        user_id: user_id,
        course_id: course_id,
      },
    })

    if (existingLike) {
      //如果已收藏取消收藏
      await existingLike.destroy()
      return res.json({ status: 'success', message: '已取消收藏' })
    } else {
      // 如果未收藏，添加收藏
      await Course_like.create({
        user_id: user_id,
        course_id: course_id,
      })
      return res.json({ status: 'success', message: '已添加收藏' })
    }
  } catch (error) {
    console.error('error:', error)
    return res.status(500).json({ message: '伺服器錯誤' })
  }
})
//獲取用戶收藏的課程
router.get('/favorites/:userId', async (req, res) => {
  const userId = req.params.userId

  try {
    const favorites = await Course_like.findAll({
      where: {
        user_id: userId,
      },
      attributes: ['course_id'], // 只返回課程ID
    })

    res.json({
      status: 'success',
      favorites: favorites.map((fav) => fav.course_id),
    })
  } catch (error) {
    console.error('獲取收藏課程失敗:', error)
    return res.status(500).json({ message: '獲取收藏課程失敗' })
  }
})

//撰寫評論
router.post('/review', async (req, res) => {
  const { course_id, user_id, user_review } = req.body

  try {
    const newReply = await Course_reviews.create({
      user_review,
      course_id,
      user_id,
      create_time: new Date(),
    })

    return res.status(201).json(newReply)
  } catch (error) {
    console.error('失敗:', error)
    return res.status(500).json({ message: '伺服器錯誤' })
  }
})
//刪除評論
router.delete('/review/:id', (req, res) => {
  const { id } = req.params

  connection.execute(
    'DELETE FROM `course_reviews` WHERE id = ?',
    [id],
    (err, results) => {
      if (err) {
        console.error(err)
        return res.status(500).json({ message: '伺服器錯誤' })
      }
      return res.status(200).json({ message: '評論已刪除' })
    }
  )
})

router.all('*', (req, res) => {
  res.send('<h1>404 - 找不到</h1>')
})

export default router
