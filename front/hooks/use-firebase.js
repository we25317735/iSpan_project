import { initializeApp } from 'firebase/app'

import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from 'firebase/auth'
import { useEffect } from 'react'

import { firebaseConfig } from './firebase-config'

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 *  - firebase.auth().getRedirectResult(): This promise completes when the user gets back from
 *    the auth redirect flow. It is where you can get the OAuth access token from the IDP.
 */
// 重定向專用，用於在同頁面(firebase的登入頁會與回調頁同一頁)監聽登入情況
// getRedirectResult回調頁時用(註:重定向後，回調回來時才會呼叫)
// onAuthStateChanged監聽auth物件變化 <---(用這個就足夠，它會在頁面一啟動偵測目前登入情況)
const initApp = (callback) => {
  const auth = getAuth()

  // 重定向身份驗證流程的結果。
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        //這將為您提供一個 Google 存取權令牌。您可以使用它來存取 Google API
        const credential = GoogleAuthProvider.credentialFromResult(result)
        const token = credential.accessToken

        // 登入的用戶資訊
        const user = result.user
        console.log(token)
        console.log(user)
      }
    })
    .catch((error) => {
      console.error(error)
    })

  // 監聽身份驗證狀態變更
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('user', user)
      // 回呼用戶數據
      callback(user.providerData[0])
    }
  })
}

// TODO: 目前不需要從firebase登出，firebase登出並不會登出google
const logoutFirebase = () => {
  const auth = getAuth()

  signOut(auth)
    .then(function () {
      // 退出成功
      console.log('google 成功登出')
      // window.location.assign('https://accounts.google.com/logout')
    })
    .catch(function (error) {
      // 發生錯誤
      console.log(error)
    })
}

const loginGoogle = async (callback) => {
  const provider = new GoogleAuthProvider()
  const auth = getAuth()

  signInWithPopup(auth, provider)
    .then(async (result) => {
      const user = result.user
      // console.log('登入的 hook: ', user.providerData[0])

      // user後端寫入資料庫等等的操作
      callback(user.providerData[0])
    })
    .catch((error) => {
      console.log(error)
    })
}

const loginGoogleRedirect = async (callback) => {
  const provider = new GoogleAuthProvider()
  const auth = getAuth()

  // redirect to google auth
  signInWithRedirect(auth, provider)
}

// TODO: fb有許多前置設定需求，有需要使用請連絡Eddy
const loginFBRedirect = () => {
  const provider = new FacebookAuthProvider()
  const auth = getAuth()

  signInWithRedirect(auth, provider)
}

export default function useFirebase() {
  useEffect(() => {
    // 一開始先連接到 firebase 的 Config
    initializeApp(firebaseConfig)
  }, [])

  return {
    loginFBRedirect,
    initApp,
    loginGoogleRedirect,
    loginGoogle,
    logoutFirebase,
  }
}
