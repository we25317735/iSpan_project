import React, { useState, useContext, createContext, useEffect } from 'react'
import { useRouter } from 'next/router'
import axiosInstance from '@/services/axios-instance'
import { checkAuth, getFavs } from '@/services/user'

const AuthContext = createContext(null)

export const initUserData = {
  id: 0,
  username: '',
  google_uid: '',
  line_uid: '',
  name: '',
  email: '',
}

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuth: false,
    userData: initUserData,
  })

  // 每次 reload 都會抓取資料
  const handleCheckAuth = async () => {
    const res = await checkAuth()
    // console.log('檢查登入 ', res)

    if (res.data.status === 'success') {
      const dbUser = res.data.data.user
      const userData = { ...initUserData }

      for (const key in userData) {
        if (Object.hasOwn(dbUser, key)) {
          userData[key] = dbUser[key] || ''
        }
      }

      // setUser_data(dbUser)
      setAuth({ isAuth: true, userData })
    } else {
      // console.warn(res.data)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        auth,
        setAuth,
        handleCheckAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
