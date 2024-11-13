import React, { useState, useEffect } from 'react' // 導入React及其相關鉤子
import { useRouter } from 'next/router' // 導入Next.js的路由鉤子
import Loading from '@/components/Loading2'

export default function User() {
  const [loading, setLoading] = useState(false) // 點擊直到切換的過渡

  const router = useRouter() // 獲取路由資訊

  useEffect(() => {
    const CardClick = async () => {
      setLoading(true)
      await router.push('http://localhost:3000/user/user_data')
      setLoading(false)
    }

    CardClick() // 在useEffect中立即執行CardClick
  }, [router]) // 將router添加到依賴數組中

  return (
    <h1>
      {loading && (
        <div style={{ width: '150px' }}>
          <Loading />
        </div>
      )}
    </h1>
  )
}
