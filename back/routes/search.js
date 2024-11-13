import express from 'express'
import connection from '../db.js'
import NodeCache from 'node-cache'

const router = express.Router()

// 設定NodeCache，TTL為10分鐘，並每2分鐘檢查過期的cache
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 })

// 產生cache key
const getCacheKey = (q, type, page) => `${q}:${type}:${page}`

// 用promise執行SQL
const queryAsync = (sql, params) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) reject(error)
      else resolve(results)
    })
  })
}

router.get('/', async (req, res) => {
  const { q, type, page = 1 } = req.query
  const limit = 12
  const offset = (parseInt(page) - 1) * limit

  const cacheKey = getCacheKey(q, type, page)

  // 檢查是否有cache的結果
  const cachedResult = cache.get(cacheKey)
  if (cachedResult) {
    return res.json(cachedResult)
  }

  try {
    let query = ''
    let countQuery = ''
    let params = [`%${q}%`, limit, offset]

    switch (type) {
      case 'products':
        query = `
          SELECT p.*
          FROM product p
          WHERE p.name LIKE ?
          LIMIT ? OFFSET ?
        `
        countQuery = `
          SELECT COUNT(*) as total
          FROM product
          WHERE name LIKE ?
        `
        break
      case 'courses':
        query = `
          SELECT c.*
          FROM course c
          WHERE c.name LIKE ?
          LIMIT ? OFFSET ?
        `
        countQuery = `
          SELECT COUNT(*) as total
          FROM course
          WHERE name LIKE ?
        `
        break
      case 'articles':
        query = `
          SELECT a.*
          FROM article a
          WHERE a.title LIKE ?
          LIMIT ? OFFSET ?
        `
        countQuery = `
          SELECT COUNT(*) as total
          FROM article
          WHERE title LIKE ?
        `
        break
      default:
        return res.json({
          status: 'success',
          data: {
            [type]: [],
            totalPages: 0,
            currentPage: parseInt(page),
            totalItems: 0,
          },
          counts: { products: 0, courses: 0, articles: 0 },
        })
    }

    // 同時執行主要查詢和數量查詢
    const [results, countResults] = await Promise.all([
      queryAsync(query, params),
      queryAsync(countQuery, [`%${q}%`]),
    ])

    const totalItems = countResults[0].total
    const totalPages = Math.ceil(totalItems / limit)

    // 同時執行所有類型的算數
    const countQueries = {
      products: 'SELECT COUNT(*) as total FROM product WHERE name LIKE ?',
      courses: 'SELECT COUNT(*) as total FROM course WHERE name LIKE ?',
      articles: 'SELECT COUNT(*) as total FROM article WHERE title LIKE ?',
    }

    const counts = await Object.entries(countQueries).reduce(
      async (accPromise, [countType, countSql]) => {
        const acc = await accPromise
        const [{ total }] = await queryAsync(countSql, [`%${q}%`])
        acc[countType] = total
        return acc
      },
      Promise.resolve({})
    )

    const response = {
      status: 'success',
      data: {
        [type]: results,
        totalPages,
        currentPage: parseInt(page),
        totalItems,
      },
      counts,
    }

    // 將結果設置到cache中
    cache.set(cacheKey, response)

    res.json(response)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
