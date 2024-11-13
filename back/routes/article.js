import express from 'express'
import sequelize from '#configs/db.js'
import connection from '../db.js'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'

const router = express.Router()
const { Article, Article_comment, Article_reply, Article_like, Product } =
  sequelize.models

router.use(express.json())

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/article')
  },
  filename: function (req, file, cb) {
    const fileExt = path.extname(file.originalname)
    const filename = `${uuidv4()}${fileExt}`
    cb(null, filename)
  },
})

const upload = multer({ storage: storage })

// http://localhost:3005/api/article

router.get('/', (req, res) => {
  res.send('文章 路由')
})

router.get('/relatedProducts', async (req, res) => {
  const tag2 = req.query.tag2
  console.log('Received tag2:', tag2)
  const limit = 2

  let categoryIds = []

  if (tag2 === '咖啡豆') {
    categoryIds = [1, 2]
  } else if (tag2 === '咖啡機') {
    categoryIds = [3, 4, 5]
  } else if (tag2 === '配件') {
    categoryIds = [6]
  } else {
    return res.status(400).json({ message: '無效的 tag2 值' })
  }

  try {
    const products = await Product.findAll({
      where: {
        category_id: categoryIds,
      },
      order: [['id', 'ASC']],
      limit: limit,
    })

    console.log('Queried Products:', products)

    return res.status(200).json({
      status: 'success',
      data: {
        products,
      },
    })
  } catch (error) {
    console.error('Database query error:', error)
    return res.status(500).json({ message: '伺服器錯誤' })
  }
})

router.get('/list', (req, res) => {
  connection.execute(
    // 資料庫撈資料
    'SELECT * FROM `Article` WHERE valid = 1',
    (error, results) => {
      if (error) {
        console.error('Database query error:', error)
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      if (results.length === 0) {
        return res.status(404).json({ message: '沒有文章' })
      }

      res.status(200).json({
        status: 'success',
        data: {
          articles: results,
        },
      })
    }
  )
})

router.get('/search', (req, res) => {
  const { keyword } = req.query

  if (!keyword) {
    return res
      .status(400)
      .json({ status: 'error', message: '搜索關鍵詞不能為空' })
  }

  const searchQuery = `
  SELECT * FROM Article 
  WHERE title LIKE ? AND valid = 1 
  `

  connection.execute(searchQuery, [`%${keyword}%`], (error, results) => {
    if (error) {
      console.error('Database query error:', error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '沒有找到相關文章' })
    }

    res.status(200).json({
      status: 'success',
      data: {
        articles: results,
      },
    })
  })
})

router.get('/:id', (req, res) => {
  const articleId = parseInt(req.params.id, 10)

  const articleQuery = 'SELECT * FROM `Article` WHERE id = ? AND valid = 1'
  const previousArticleQuery =
    'SELECT * FROM `Article` WHERE id < ? AND valid = 1 ORDER BY id DESC LIMIT 1'
  const nextArticleQuery =
    'SELECT * FROM `Article` WHERE id > ? AND valid = 1 ORDER BY id ASC LIMIT 1'
  const articleLikesQuery = `SELECT COUNT(DISTINCT article_like.id) as likes_count 
     FROM article_like 
     WHERE article_like.target_type = 'article' AND article_like.target_id = ?`

  Promise.all([
    new Promise((resolve, reject) => {
      connection.execute(articleQuery, [articleId], (error, results) => {
        if (error) return reject(error)
        resolve(results.length > 0 ? results[0] : null)
      })
    }),
    new Promise((resolve, reject) => {
      connection.execute(
        previousArticleQuery,
        [articleId],
        (error, results) => {
          if (error) return reject(error)
          resolve(results.length > 0 ? results[0] : null)
        }
      )
    }),
    new Promise((resolve, reject) => {
      connection.execute(nextArticleQuery, [articleId], (error, results) => {
        if (error) return reject(error)
        resolve(results.length > 0 ? results[0] : null)
      })
    }),
    new Promise((resolve, reject) => {
      connection.execute(articleLikesQuery, [articleId], (error, results) => {
        if (error) return reject(error)
        resolve(results.length > 0 ? results[0].likes_count : 0)
      })
    }),
  ])
    .then(([article, previousArticle, nextArticle, likes_count]) => {
      if (!article) {
        return res.status(404).json({ message: '文章未找到' })
      }

      // 將按讚數添加到文章對象中
      article.likes_count = likes_count

      res.status(200).json({
        status: 'success',
        data: {
          article,
          previousArticle,
          nextArticle,
        },
      })
    })
    .catch((error) => {
      console.error('Database query error:', error)
      res.status(500).json({ message: '伺服器錯誤' })
    })
})

router.post('/publish', async (req, res) => {
  try {
    console.log('Headers:', req.headers)
    const { title, content, tag1, tag2, create_time, valid, image_url } =
      req.body

    const newArticle = await Article.create({
      title,
      image_url,
      content,
      tag1,
      tag2,
      create_time,
      valid: valid || 1,
    })

    res.status(201).json({
      status: 'success',
      data: {
        article: newArticle,
      },
    })
  } catch (error) {
    console.error('Database insertion error:', error)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

router.post('/upload', upload.single('articleImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '文件上傳失敗' })
    }
    const url = `/images/article/${req.file.filename}`
    res.status(200).json({ url })
  } catch (error) {
    console.error('圖片上傳錯誤:', error)
    res.status(500).json({ message: '伺服器錯誤' })
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id)
    if (!article) {
      return res.status(404).json({ status: 'error', message: '文章未找到' })
    }

    article.valid = 0
    await article.save()

    res.json({ status: 'success', message: '文章已標記為刪除' })
  } catch (error) {
    next(error)
  }
})

// 更新文章
router.put('/:id/edit', (req, res) => {
  const articleId = req.params.id
  const { title, content, tag1, tag2, image_url, valid } = req.body

  const updateQuery = `
    UPDATE Article 
    SET title = ?, content = ?, tag1 = ?, tag2 = ?, image_url = ?, valid = ? 
    WHERE id = ?
  `

  connection.execute(
    updateQuery,
    [title, content, tag1, tag2, image_url, valid, articleId],
    (error, results) => {
      if (error) {
        console.error('Database update error:', error)
        return res.status(500).json({ message: '伺服器錯誤' })
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: '文章未找到' })
      }

      const selectQuery = 'SELECT * FROM `Article` WHERE id = ?'
      connection.execute(selectQuery, [articleId], (error, results) => {
        if (error) {
          console.error('Database query error after update:', error)
          return res.status(500).json({ message: '伺服器錯誤' })
        }

        res.status(200).json({
          status: 'success',
          data: {
            article: results[0],
          },
        })
      })
    }
  )
})

router.get('/comments/:articleId', async (req, res) => {
  const { articleId } = req.params
  try {
    const commentsWithReplies = await getCommentsAndRepliesForArticle(articleId)
    res.json(commentsWithReplies)
  } catch (error) {
    console.error('Error fetching comments and replies:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

async function getCommentsAndRepliesForArticle(articleId) {
  // 獲取評論及其用戶信息
  const [comments] = await connection.promise().query(
    `SELECT article_comment.*, 
            user.name as user_name, 
            user.img as user_img,
            COUNT(DISTINCT article_like.id) as likes_count
     FROM article_comment 
     LEFT JOIN user ON article_comment.user_id = user.id
     LEFT JOIN article_like ON article_like.target_type = 'comment' AND article_like.target_id = article_comment.id
     WHERE article_comment.article_id = ?
     GROUP BY article_comment.id
     ORDER BY article_comment.create_time DESC`,
    [articleId]
  )

  const commentIds = comments.map((comment) => comment.id)

  // 獲取回覆及其用戶信息
  const [replies] = await connection.promise().query(
    `SELECT article_reply.*, 
            user.name as user_name, 
            user.img as user_img,
            COUNT(DISTINCT article_like.id) as likes_count
     FROM article_reply 
     LEFT JOIN user ON article_reply.user_id = user.id
     LEFT JOIN article_like ON article_like.target_type = 'reply' AND article_like.target_id = article_reply.id
     WHERE article_reply.comment_id IN (?)
     GROUP BY article_reply.id
     ORDER BY article_reply.create_time ASC`,
    [commentIds]
  )

  const commentsMap = new Map(
    comments.map((comment) => [comment.id, { ...comment, replies: [] }])
  )

  for (const reply of replies) {
    const comment = commentsMap.get(reply.comment_id)
    if (comment) {
      comment.replies.push(reply)
    }
  }

  return Array.from(commentsMap.values())
}

router.delete('/comments/:id', async (req, res) => {
  try {
    const commentId = req.params.id
    const { userId } = req.query

    const comment = await Article_comment.findOne({
      where: { id: commentId, user_id: userId },
    })

    if (!comment) {
      return res
        .status(404)
        .json({ message: '評論未找到或你沒有權限刪除此評論' })
    }

    // 刪除評論
    await comment.destroy()

    return res.status(200).json({ message: '評論已刪除' })
  } catch (error) {
    console.error('刪除評論失敗:', error)
    return res.status(500).json({ message: '伺服器錯誤' })
  }
})

router.post('/likes', async (req, res) => {
  const { user_id, target_type, target_id } = req.body
  console.log(req.body)

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const existingLike = await Article_like.findOne({
      where: {
        user_id: user_id,
        target_type: target_type,
        target_id: target_id,
      },
    })

    if (existingLike) {
      await existingLike.destroy()
      return res.json({ liked: false })
    } else {
      await Article_like.create({
        user_id: user_id,
        target_type: target_type,
        target_id: target_id,
      })
      return res.json({ liked: true })
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    return res.status(500).json({ error: 'Failed to toggle like' })
  }
})

// 獲取文章的按讚數量
router.get('/:id/likes', async (req, res) => {
  const articleId = req.params.id

  try {
    const likesCount = await Article_like.count({
      where: { target_type: 'article', target_id: articleId },
    })

    return res.json({ likes_count: likesCount })
  } catch (error) {
    console.error('Error fetching article likes:', error)
    return res.status(500).json({ error: 'Failed to fetch likes count' })
  }
})

router.get('/:articleId/like-status', async (req, res) => {
  const { articleId } = req.params
  const { userId } = req.query

  const like = await Article_like.findOne({
    where: {
      target_type: 'article',
      target_id: articleId,
      user_id: userId,
    },
  })

  if (like) {
    res.json({ isLiked: true })
  } else {
    res.json({ isLiked: false })
  }
})

// 提交回覆
router.post('/replies', async (req, res) => {
  const { content, commentId, userId } = req.body

  // 驗證輸入
  if (!content || !commentId || !userId) {
    return res.status(400).json({ message: '無效的請求參數' })
  }

  try {
    const newReply = await Article_reply.create({
      content,
      comment_id: commentId,
      user_id: userId,
      create_time: new Date(),
    })

    return res.status(201).json(newReply)
  } catch (error) {
    console.error('新增回覆失敗:', error)
    return res.status(500).json({ message: '無法新增回覆' })
  }
})

router.delete('/replies/:id', async (req, res) => {
  try {
    const replyId = req.params.id
    const { userId } = req.query

    // 找到回覆並確保當前用戶是回覆的作者
    const reply = await Article_reply.findOne({
      where: { id: replyId, user_id: userId },
    })

    if (!reply) {
      return res
        .status(404)
        .json({ message: '回覆未找到或你沒有權限刪除此回覆' })
    }

    // 刪除回覆
    await reply.destroy()

    return res.status(200).json({ message: '回覆已刪除' })
  } catch (error) {
    console.error('刪除回覆失敗:', error)
    return res.status(500).json({ message: '伺服器錯誤' })
  }
})

router.post('/:articleId/comments', async (req, res) => {
  console.log('Request body:', req.body)
  try {
    const { articleId } = req.params
    const { userId, content } = req.body

    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required' })
    }

    const article = await Article.findByPk(articleId)
    if (!article) {
      return res.status(404).json({ error: 'Article not found' })
    }

    const newComment = await Article_comment.create({
      article_id: articleId,
      user_id: userId,
      content: content,
      create_time: new Date(),
    })

    res.status(201).json(newComment)
  } catch (error) {
    console.error('Error creating comment:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
