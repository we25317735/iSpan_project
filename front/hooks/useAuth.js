import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

import { useRouter } from 'next/router'

// 自訂 Hook: useAuth
// 用來處理登入和登出功能
const useAuth = () => {
  // 從 AuthContext 中獲取 setUser、token 和 setToken 函數
  // setUser 用於設定用戶資訊 (雖然在此 Hook 中未使用)
  // token 和 setToken 用於獲取和設定當前的 token
  const { setUser, token, setToken } = useContext(AuthContext)
  const router = useRouter() // 初始化router

  // 登入函數
  // const login = async (account, password) => {
  //   let newToken, error
  //   // 登入 API 的 URL
  //   const url = 'http://localhost:3001/api/users/login'
  //   // 使用 FormData 來包裝帳號和密碼
  //   const formData = new FormData()
  //   formData.append('account', account)
  //   formData.append('password', password)

  //   // 發送 POST 請求進行登入
  //   newToken = await fetch(url, {
  //     method: 'POST',
  //     body: formData,
  //   })
  //     .then((res) => res.json()) // 解析 JSON 響應
  //     .then((result) => {
  //       // 如果回應狀態為成功
  //       if (result.status === 'success') {
  //         // 從響應中獲取 token
  //         return result.token
  //       } else {
  //         // 否則拋出錯誤
  //         throw new Error(result.message)
  //       }
  //     })
  //     .catch((err) => {
  //       // 捕捉錯誤並設定 error 變數
  //       error = err
  //       return undefined
  //     })

  //   // 如果有錯誤，顯示錯誤訊息並退出
  //   if (error) {
  //     alert(error.message)
  //     return
  //   }
  //   // 如果成功獲取到 token
  //   if (newToken) {
  //     // 更新 token 到 Context 中
  //     setToken(newToken)
  //     // 同時將 token 儲存到 localStorage 中
  //     localStorage.setItem('nextBenToken', newToken)
  //   }
  // }

  // 登出函數
  const logout = async () => {
    let newToken, error
    // 登出 API 的 URL
    const url = 'http://localhost:3005/api/user/logout'

    console.log('有收到 token ', token)

    // 發送 GET 請求進行登出
    newToken = await fetch(url, {
      method: 'GET',
      headers: {
        // 在請求頭中加入 Authorization，格式為 "Bearer [token]"
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json()) // 解析 JSON 響應
      .then((result) => {
        // console.log('但這邊沒返回東西 ', result)

        // 如果回應狀態為成功
        if (result.status === 'success') {
          // 從響應中獲取 token (通常登出不會返回新的 token，這裡可能是 API 設計上的特殊需求)
          return result.token
        } else {
          // 否則拋出錯誤
          throw new Error(result.message)
        }
      })
      .catch((err) => {
        // 捕捉錯誤並設定 error 變數
        error = err
        return undefined
      })

    // 如果成功獲取到 token
    if (newToken) {
      // 更新 token 到 Context 中
      setToken(newToken)
      // 同時將 token 儲存到 localStorage 中
      localStorage.setItem('TheToken', newToken)
    } else {
      // 如果沒有新的 token，則移除 localStorage 中的 token
      localStorage.removeItem('TheToken')
      // 清空 Context 中的 token
      setToken(null)
    }

    console.log('登出時要跳回首頁')
  }

  // 返回登入和登出的函數
  return { logout }
}

export default useAuth
