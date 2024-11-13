import React, { useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import { FaGoogle } from 'react-icons/fa'
import { useAuth } from '@/hooks/use-auth'
import useFirebase from '@/hooks/use-firebase'
import { googleLogin, parseJwt, getUserById } from '@/services/user'
import toast, { Toaster } from 'react-hot-toast'
import { initUserData } from '@/hooks/use-auth'
import GoogleLogo from '@/components/icons/google-logo'

// 後續新增
import { AuthContext } from '@/context/AuthContext'

// 取出當前使用者
// import { AuthContext } from '@/context/AuthContext'

// google 登入按鈕
export default function google_btn() {
  const { loginGoogle } = useFirebase()
  const { auth, setAuth } = useAuth()
  const { setUser } = useContext(AuthContext) //專案的寫法

  const router = useRouter()

  // Google 登入後處理
  const callbackGoogleLoginPopup = async (providerData) => {
    if (auth.isAuth) return

    // console.log('測試:', providerData)

    const res = await googleLogin(providerData)

    if (res.data.status === 'success') {
      const jwtUser = parseJwt(res.data.data.accessToken)
      const res1 = await getUserById(jwtUser.id)

      console.log('google 裡面裝的 token: ', res1.data.token)
      localStorage.setItem('TheToken', res1.data.token) //

      // 去 user 抓到資料後執行
      if (res1.data.status === 'success') {
        const jwtUser = parseJwt(res1.data.token)
        // const dbUser = res1.data.data.user
        // const userData = { ...initUserData }

        // for (const key in userData) {
        //   if (Object.hasOwn(dbUser, key)) {
        //     userData[key] = dbUser[key] || ''
        //   }
        // }

        setAuth({
          isAuth: true,
          userData: jwtUser,
        })

        console.log('資料: ', jwtUser) // 使用者所有資料

        toast.success('已成功登入')
        setUser(jwtUser) // 把東西放進 context 裡面

        router.push('/IGotBrew') // 登入成功後跳轉到首頁
      } else {
        toast.error('登入後無法得到會員資料')
      }
    } else {
      toast.error('登入失敗')
    }
  }

  return (
    <>
      {/* <FaGoogle
        size={30}
        color="blue"
        style={{
          cursor: 'pointer',
          backgroundColor: '#ffffff', // 半透明背景顏色
          border: '2px solid black', // 黑色邊框
          borderRadius: '30%', // 圓角
          padding: '5px', // 內距
        }}
      /> */}

      <button
        style={{
          cursor: 'pointer',
          backgroundColor: 'transparent',
          border: '2px solid #6b92a4',
          borderRadius: '10px',
        }}
        type="button"
        className="p-1"
        onClick={() => loginGoogle(callbackGoogleLoginPopup)}
      >
        <GoogleLogo />
      </button>
    </>
  )
}
