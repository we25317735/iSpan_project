import express from 'express'
import connection from '../db.js'
const router = express.Router()

const cache = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const cacheMiddleware = (key) => (req, res, next) => {
  const cachedData = cache.get(key)
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return res.json(cachedData.data)
  }
  next()
}

router.get('/', async (req, res) => {
  try {
    const [
      genderRatio,
      productSales,
      courseSales,
      articleLikes,
      userRegistration,
      orderTrend,
    ] = await Promise.all([
      getGenderRatio(),
      getProductSales(),
      getCourseSales(),
      getArticleLikes(),
      getUserRegistrationTrend(),
      getOrderTrend(),
    ])

    res.json({
      genderRatio,
      productSales,
      courseSales,
      articleLikes,
      userRegistration,
      orderTrend,
    })
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

async function optimizedQuery(query) {
  const [rows] = await connection.promise().query(query)
  return rows
}

async function getGenderRatio() {
  return optimizedQuery(`
    SELECT gender, COUNT(*) as value
    FROM user
    GROUP BY gender
  `)
}

async function getProductSales() {
  return optimizedQuery(`
    SELECT pc.type as name, SUM(od.product_quantity) as sales
    FROM order_detail od
    JOIN product p ON od.product_id = p.id
    JOIN product_category pc ON p.category_id = pc.id
    GROUP BY pc.type
    ORDER BY sales DESC
    LIMIT 5
  `)
}

async function getCourseSales() {
  const data = await optimizedQuery(`
 SELECT 
      ct.tagname AS name, 
      SUM(IFNULL(od.course_quantity, 0)) AS sales
    FROM 
      order_detail od
    JOIN 
      course c ON od.course_id = c.id
    JOIN 
      coursetags ct ON ct.id IN (c.tag1, c.tag2)
    GROUP BY 
      ct.tagname
    ORDER BY 
      sales DESC
    LIMIT 5
  `)

  // 如果沒有數據，返回一個預設值
  if (data.length === 0) {
    return [{ name: '無數據', sales: 0 }]
  }

  return data
}

async function getArticleLikes() {
  const data = await optimizedQuery(`
    SELECT a.title, COUNT(*) as likes
    FROM article_like al
    JOIN article a ON al.target_id = a.id
    GROUP BY a.id
    ORDER BY likes DESC
    LIMIT 5
  `)
  cache.set('articleLikes', { data, timestamp: Date.now() })
  return data
}

async function getUserRegistrationTrend() {
  const data = await optimizedQuery(`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM user
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `)
  cache.set('userRegistration', { data: data.reverse(), timestamp: Date.now() })
  return data.reverse()
}

async function getOrderTrend() {
  const data = await optimizedQuery(`
    SELECT DATE(create_time) as date, COUNT(*) as count
    FROM order_list
    GROUP BY DATE(create_time)
    ORDER BY date DESC
    LIMIT 30
  `)
  cache.set('orderTrend', { data: data.reverse(), timestamp: Date.now() })
  return data.reverse()
}

export default router
