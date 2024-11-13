import express from 'express'
import connection from '../db.js'
import multer from 'multer'
import path from 'path'

const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'img') {
      cb(null, 'public/images/hello/')
    } else if (file.fieldname === 'detail_imgs') {
      cb(null, 'public/images/detail-img/')
    }
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now()
    const originalName = file.originalname.replace(/\.[^/.]+$/, '') // 檔名(去掉副檔名)
    const extension = path.extname(file.originalname) // 附檔名
    cb(null, `${originalName}_${timestamp}${extension}`) // 新的文件名
  },
})

const upload = multer({ storage: storage })
// http://localhost:3005/api/product
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = 12 // 每页显示的商品数量
  const offset = (page - 1) * limit

  const type = req.query.type
  const category_id = req.query.category_id
  const sort = req.query.sort || 'default'
  const min_price = req.query.min_price
  const max_price = req.query.max_price

  let query = `
    SELECT p.*, AVG(pc.score) as average_score, COUNT(*) OVER() as total, SUM(od.product_quantity) AS total_sold
    FROM product p
    LEFT JOIN product_comment pc ON p.id = pc.product_id
    LEFT JOIN order_detail od ON p.id = od.product_id
    WHERE 1=1
  `
  let params = []

  if (type) {
    query +=
      ' AND p.category_id IN (SELECT id FROM product_category WHERE type = ?)'
    params.push(type)
  }

  if (category_id) {
    query += ' AND p.category_id = ?'
    params.push(category_id)
  }

  if (min_price) {
    query += ' AND p.price >= ?'
    params.push(min_price)
  }

  if (max_price) {
    query += ' AND p.price <= ?'
    params.push(max_price)
  }

  query += ' GROUP BY p.id'

  switch (sort) {
    case 'price_asc':
      query += ' ORDER BY p.price ASC'
      break
    case 'price_desc':
      query += ' ORDER BY p.price DESC'
      break
    case 'rating_desc':
      query += ' ORDER BY average_score DESC'
      break
    case 'total_sold_desc':
      query += ' ORDER BY total_sold DESC'
      break
    default:
      query += ' ORDER BY p.id ASC'
  }

  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length > 0) {
      const totalProducts = results[0].total
      const totalPages = Math.ceil(totalProducts / limit)

      return res.status(200).json({
        status: 'success',
        data: {
          products: results,
          totalPages,
          currentPage: page,
          totalProducts,
        },
      })
    } else {
      return res.status(200).json({
        status: 'success',
        data: {
          products: [],
          totalPages: 0,
          currentPage: page,
          totalProducts: 0,
        },
      })
    }
  })
})
// 新增路由以獲取分類
router.get('/categories', (req, res) => {
  const type = req.query.type

  const query = 'SELECT * FROM product_category WHERE type = ?'
  connection.query(query, [type], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    return res.status(200).json({
      status: 'success',
      data: { categories: results },
    })
  })
})

router.get('/special', (req, res) => {
  const query = `
    SELECT *
FROM product
WHERE special = 1
  `

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    return res.status(200).json({
      status: 'success',
      data: { products: results },
    })
  })
})
router.get('/top-rated', (req, res) => {
  const query = `
    SELECT p.*, AVG(pc.score) as average_score
    FROM product p
    JOIN product_comment pc ON p.id = pc.product_id
    GROUP BY p.id
    ORDER BY average_score DESC
    LIMIT 3
  `

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    return res.status(200).json({
      status: 'success',
      data: { products: results },
    })
  })
})
router.get('/limited-time', (req, res) => {
  const query = `
    SELECT limited_time
    FROM product_limitspecial
    WHERE product_special = 1
    LIMIT 1
  `

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length > 0) {
      return res.status(200).json({
        status: 'success',
        data: { limitedTime: results[0].limited_time },
      })
    } else {
      return res.status(404).json({ message: '未找到限時特賣資訊' })
    }
  })
})
router.get('/hot-products', (req, res) => {
  const query = `
    SELECT p.*, SUM(od.product_quantity) AS total_sold
    FROM product p
    JOIN order_detail od ON p.id = od.product_id
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 3
  `

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    return res.status(200).json({
      status: 'success',
      data: { products: results },
    })
  })
})

router.get('/price-range', (req, res) => {
  const { type, category_id } = req.query
  let query =
    'SELECT MIN(price) as minPrice, MAX(price) as maxPrice FROM product'
  let params = []

  if (type) {
    query +=
      ' WHERE category_id IN (SELECT id FROM product_category WHERE type = ?)'
    params.push(type)
  }

  if (category_id) {
    query += type ? ' AND category_id = ?' : ' WHERE category_id = ?'
    params.push(category_id)
  }

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length > 0) {
      return res.status(200).json({
        status: 'success',
        data: {
          minPrice: results[0].minPrice,
          maxPrice: results[0].maxPrice,
        },
      })
    } else {
      return res.status(200).json({
        status: 'success',
        data: {
          minPrice: 0,
          maxPrice: 0,
        },
      })
    }
  })
})

// 商品細節頁 資料調取
router.get('/:id', (req, res) => {
  const productId = req.params.id

  const query = `
    SELECT p.*, pc.name AS category_name, AVG(pcom.score) AS average_score,
           COUNT(DISTINCT pcom.id) AS review_count
    FROM product p
    LEFT JOIN product_category pc ON p.category_id = pc.id
    LEFT JOIN product_comment pcom ON p.id = pcom.product_id
    WHERE p.id = ?
    GROUP BY p.id
  `

  connection.query(query, [productId], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '服务器错误' })
    }

    if (results.length === 0) {
      return res.status(404).json({ message: '未找到产品' })
    }

    const product = results[0]

    // 获取产品详情图片
    const detailImgQuery =
      'SELECT detail_img FROM product_detail WHERE product_id = ?'
    connection.query(detailImgQuery, [productId], (error, detailImgs) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: '服务器错误' })
      }

      product.detailImgs = detailImgs.map((img) => img.detail_img)

      // 获取产品评论
      const commentQuery = `
  SELECT pc.*, u.name AS user_name, u.img AS user_img,
         DATE_FORMAT(pc.created_at, '%Y-%m-%d') AS formatted_date
  FROM product_comment pc
  LEFT JOIN user u ON pc.user_id = u.id
  WHERE pc.product_id = ?
  ORDER BY pc.created_at DESC
`
      connection.query(commentQuery, [productId], (error, comments) => {
        if (error) {
          console.log(error)
          return res.status(500).json({ message: '服務器錯誤' })
        }

        product.comments = comments

        // 商品詳細頁, 相關產品調取 (用 RAND() 隨機調取)
        const relatedProductsQuery = `
          SELECT id, name, price, img, price, discount
          FROM product
          WHERE category_id = ? AND id != ?
          ORDER BY RAND()
          LIMIT 4
        `
        connection.query(
          relatedProductsQuery,
          [product.category_id, productId],
          (error, relatedProducts) => {
            if (error) {
              console.log(error)
              return res.status(500).json({ message: '服務器錯誤' })
            }

            product.relatedProducts = relatedProducts

            res.json({
              status: 'success',
              data: product,
            })
          }
        )
      })
    })
  })
})

// 檢查用戶是否已經評論過該產品
router.get('/:id/comment', (req, res) => {
  const productId = req.params.id
  const userId = req.query.user_id

  const query = `
    SELECT * 
    FROM product_comment
    WHERE product_id = ? AND user_id = ?
    LIMIT 1
  `

  connection.query(query, [productId, userId], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '服務器錯誤' })
    }

    if (results.length > 0) {
      return res.json(results[0])
    } else {
      return res.json(null)
    }
  })
})

// 添加評論
router.post('/comment', (req, res) => {
  const { user_id, product_id, score, comment } = req.body

  const query = `
    INSERT INTO product_comment (user_id, product_id, score, comment, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
  `

  connection.query(
    query,
    [user_id, product_id, score, comment],
    (error, results) => {
      if (error) {
        console.log(error)
        return res.status(500).json({ message: '服務器錯誤' })
      }

      res.status(201).json({
        status: 'success',
        message: '評論已添加',
        data: { id: results.insertId },
      })
    }
  )
})

// 編輯評論
router.put('/comment/:id', (req, res) => {
  const commentId = req.params.id
  const { score, comment } = req.body

  const query = `
    UPDATE product_comment
    SET score = ?, comment = ?, updated_at = NOW()
    WHERE id = ?
  `

  connection.query(query, [score, comment, commentId], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '服務器錯誤' })
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '評論不存在' })
    }

    res.json({
      status: 'success',
      message: '評論已更新',
    })
  })
})

// 刪除評論
router.delete('/comment/:id', (req, res) => {
  const commentId = req.params.id

  const query = 'DELETE FROM product_comment WHERE id = ?'

  connection.query(query, [commentId], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '服務器錯誤' })
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '評論不存在' })
    }

    res.json({
      status: 'success',
      message: '評論已刪除',
    })
  })
})

// 獲取產品所有評論
router.get('/:id/comments', (req, res) => {
  const productId = req.params.id
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const offset = (page - 1) * limit

  const query = `
    SELECT pc.*, u.name AS user_name, u.img AS user_img,
           DATE_FORMAT(pc.created_at, '%Y-%m-%d') AS formatted_date,
           COUNT(*) OVER() as total_count
    FROM product_comment pc
    LEFT JOIN user u ON pc.user_id = u.id
    WHERE pc.product_id = ?
    ORDER BY pc.created_at DESC
    LIMIT ? OFFSET ?
  `

  connection.query(query, [productId, limit, offset], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '服務器錯誤' })
    }

    const totalCount = results.length > 0 ? results[0].total_count : 0
    const totalPages = Math.ceil(totalCount / limit)

    res.json({
      status: 'success',
      data: {
        comments: results,
        currentPage: page,
        totalPages: totalPages,
        totalComments: totalCount,
      },
    })
  })
})
router.get('/admin/products', (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = 20
  const offset = (page - 1) * limit

  let query = `
    SELECT p.*, pc.name AS category_name, COUNT(*) OVER() as total
    FROM product p
    LEFT JOIN product_category pc ON p.category_id = pc.id
    WHERE 1=1
  `
  let params = []

  if (req.query.status) {
    query += ' AND p.status = ?'
    params.push(req.query.status)
  }

  if (req.query.category) {
    query += ' AND p.category_id = ?'
    params.push(req.query.category)
  }

  if (req.query.sort === 'id_asc') {
    query += ' ORDER BY p.id ASC'
  } else if (req.query.sort === 'id_desc') {
    query += ' ORDER BY p.id DESC'
  }

  query += ' LIMIT ? OFFSET ?'
  params.push(limit, offset)

  connection.query(query, params, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    const totalProducts = results.length > 0 ? results[0].total : 0
    const totalPages = Math.ceil(totalProducts / limit)

    // 使用 Promise.all 处理 detailImgs 的查询
    const productDetailImgPromises = results.map((product) => {
      return new Promise((resolve, reject) => {
        const detailImgQuery = `
          SELECT detail_img 
          FROM product_detail 
          WHERE product_id = ?
        `
        connection.query(detailImgQuery, [product.id], (error, detailImgs) => {
          if (error) {
            return reject(error)
          }
          product.detailImgs = detailImgs.map((img) => img.detail_img)
          resolve(product)
        })
      })
    })

    Promise.all(productDetailImgPromises)
      .then((products) => {
        res.json({
          products,
          totalPages,
        })
      })
      .catch((error) => {
        console.log(error)
        return res.status(500).json({ message: '伺服器錯誤' })
      })
  })
})

// 獲取所有類別（管理用）
router.get('/admin/categories', (req, res) => {
  const query = 'SELECT * FROM product_category'

  connection.query(query, (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    res.json(results)
  })
})

// 添加新商品
router.post(
  '/admin/products',
  upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'detail_imgs', maxCount: 3 },
  ]),
  (req, res) => {
    const {
      name,
      category_id,
      price,
      discount,
      stock,
      content,
      status,
      ontime,
      offtime,
      special,
    } = req.body

    const img = req.files['img'] ? req.files['img'][0].filename : null
    const detail_imgs = req.files['detail_imgs']
      ? req.files['detail_imgs'].map((file) => file.filename)
      : []

    const query = `
    INSERT INTO product (name, category_id, price, discount, stock, content, status, ontime, offtime, special, img)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `

    connection.query(
      query,
      [
        name,
        category_id,
        price,
        discount,
        stock,
        content,
        status,
        ontime,
        offtime,
        special,
        img,
      ],
      (error, results) => {
        if (error) {
          console.log(error)
          return res.status(400).json({ message: '新增商品失敗' })
        }

        const productId = results.insertId

        if (detail_imgs.length > 0) {
          const detailQuery = `
            INSERT INTO product_detail (product_id, detail_img)
            VALUES ?
          `
          const detailValues = detail_imgs.map((img) => [productId, img])

          connection.query(detailQuery, [detailValues], (detailError) => {
            if (detailError) {
              console.log(detailError)
              return res.status(400).json({ message: '新增商品細節圖片失敗' })
            }

            res
              .status(201)
              .json({ id: productId, ...req.body, img, detail_imgs })
          })
        } else {
          res.status(201).json({ id: productId, ...req.body, img })
        }
      }
    )
  }
)

// 更新商品
router.put(
  '/admin/products/:id',
  upload.fields([
    { name: 'img', maxCount: 1 },
    { name: 'detail_imgs', maxCount: 3 },
  ]),
  (req, res) => {
    const { id } = req.params
    const {
      name,
      category_id,
      price,
      discount,
      stock,
      content,
      status,
      ontime,
      offtime,
      special,
      existing_detail_imgs,
    } = req.body
    const img = req.files['img'] ? req.files['img'][0].filename : null
    const detail_imgs = req.files['detail_imgs']
      ? req.files['detail_imgs'].map((file) => file.filename)
      : []

    let query = `
    UPDATE product
    SET name = ?, category_id = ?, price = ?, discount = ?, stock = ?, 
        content = ?, status = ?, ontime = ?, offtime = ?, special = ?
    `
    let params = [
      name,
      category_id,
      price,
      discount,
      stock,
      content,
      status,
      ontime,
      offtime,
      special,
    ]

    if (img) {
      query += ', img = ?'
      params.push(img)
    }

    query += ' WHERE id = ?'
    params.push(id)

    connection.query(query, params, (error, results) => {
      if (error) {
        console.error('Error updating product:', error)
        return res
          .status(500)
          .json({ message: '更新商品失敗', error: error.message })
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: '商品不存在' })
      }

      // 删除旧的详细图片记录
      const deleteDetailsQuery =
        'DELETE FROM product_detail WHERE product_id = ?'
      connection.query(deleteDetailsQuery, [id], (deleteError) => {
        if (deleteError) {
          console.error('Error deleting old details:', deleteError)
          return res.status(500).json({
            message: '删除旧的详细图片失败',
            error: deleteError.message,
          })
        }

        // 准备新的详细图片记录
        const newDetailImgs = [
          ...(existing_detail_imgs ? JSON.parse(existing_detail_imgs) : []),
          ...detail_imgs,
        ]

        // 插入新的详细图片记录
        if (newDetailImgs.length > 0) {
          const insertDetailsQuery =
            'INSERT INTO product_detail (product_id, detail_img) VALUES ?'
          const detailParams = newDetailImgs.map((detail) => [id, detail])

          connection.query(
            insertDetailsQuery,
            [detailParams],
            (insertError) => {
              if (insertError) {
                console.error('Error inserting new details:', insertError)
                return res.status(500).json({
                  message: '插入新的详细图片失败',
                  error: insertError.message,
                })
              }

              res.json({
                message: '商品及详细图片更新成功',
                id,
                ...req.body,
                img: img || undefined,
                detail_imgs: newDetailImgs,
              })
            }
          )
        } else {
          res.json({
            message: '商品更新成功',
            id,
            ...req.body,
            img: img || undefined,
          })
        }
      })
    })
  }
)

// 刪除商品
router.delete('/admin/products/:id', (req, res) => {
  const id = req.params.id

  const query = 'DELETE FROM product WHERE id = ?'

  connection.query(query, [id], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '刪除商品失敗' })
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: '商品不存在' })
    }

    res.json({ message: '商品已刪除' })
  })
})
//data為使用者收藏的商品id們
router.get('/favorites/:userId', (req, res) => {
  const userId = req.params.userId

  const query = 'SELECT product_id FROM product_like WHERE user_id = ?'

  connection.query(query, [userId], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    res.json({
      status: 'success',
      favorites: results,
    })
  })
})

// 添加或移除收藏
router.post('/favorite', (req, res) => {
  const { user_id, product_id } = req.body

  const checkQuery =
    'SELECT * FROM product_like WHERE user_id = ? AND product_id = ?'

  connection.query(checkQuery, [user_id, product_id], (error, results) => {
    if (error) {
      console.log(error)
      return res.status(500).json({ message: '伺服器錯誤' })
    }

    if (results.length > 0) {
      // 如果已存在，則刪除該收藏
      const deleteQuery =
        'DELETE FROM product_like WHERE user_id = ? AND product_id = ?'

      connection.query(deleteQuery, [user_id, product_id], (error) => {
        if (error) {
          console.log(error)
          return res.status(500).json({ message: '伺服器錯誤' })
        }
        res.json({ status: 'success', message: '已移除收藏' })
      })
    } else {
      // 如果不存在，則添加收藏
      const insertQuery =
        'INSERT INTO product_like (user_id, product_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())'

      connection.query(insertQuery, [user_id, product_id], (error) => {
        if (error) {
          console.log(error)
          return res.status(500).json({ message: '伺服器錯誤' })
        }
        res.json({ status: 'success', message: '已添加收藏' })
      })
    }
  })
})

export default router
