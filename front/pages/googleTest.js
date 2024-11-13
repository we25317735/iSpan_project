import useFirebase from '@/hooks/use-firebase'
import { useAuth } from '@/hooks/use-auth'
import GoogleLogo from '@/components/icons/google-logo'
import { useEffect } from 'react'
import axios from 'axios'

export default function GoogleTest() {
  const { loginGoogle, initApp, logoutFirebase } = useFirebase()
  const { auth, setAuth } = useAuth()

  useEffect(() => {
    initApp((providerData) => {
      if (providerData) {
        setAuth({ isAuth: true, ...providerData })
        console.log('成功登入', providerData)

        const api = 'http://localhost:3005/user/google'
        axios
          .post(api, providerData)
          .then((res) => {
            console.log('收編帳號: ', res.data)
          })
          .catch((err) => {
            console.log('收編失敗', err)
          })
      } else {
        setAuth({ isAuth: false })
        console.log('登入失敗', providerData)
      }
    })
  }, [])

  // 處理google登入後，要向伺服器進行登入動作
  const callbackGoogleLoginPopup = async (providerData) => {
    console.log('回傳函數 ', providerData)
  }

  return (
    <div>
      <p>會員狀態:{auth.isAuth ? '已登入' : '未登入'}</p>
      <button onClick={() => loginGoogle(callbackGoogleLoginPopup)}>
        <GoogleLogo /> Google登入
      </button>

      <button onClick={() => logoutFirebase()}>登出</button>
    </div>
  )
}
