import React, { createContext, useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import jwt from 'jsonwebtoken'

/* 
    處理初始登入狀態的地方
    (拿 ben 老師上課的東西來修改)
*/

// 建立一個名為 AuthContext 的上下文（context）
export const AuthContext = createContext(null)

// 建立 AuthProvider 元件，作為提供認證相關狀態和功能的容器
export const AuthProvider2 = ({ children }) => {
  const router = useRouter()
  const [token, setToken] = useState(undefined)
  const [user, setUser] = useState(undefined) // 使用者資訊
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    if (token) {
      // 檢查 token 是否有效
      // console.log('我的亂碼:', token)
      let result = jwt.decode(token)
      // console.log('我的 result ', result)
      if (result.account) {
        // console.log("有效", result);
        // 如果 token 有效，設置使用者資訊
        setUser(result)
        // console.log("數據 ", user);
      } else {
        // console.log("無效 ",result);
        setUser(undefined)
      }
    }
  }, [token])

  // 拿原有的token去更換新的token (似乎也沒在運作就是了)
  useEffect(() => {
    /* 目前舊的拿去還是舊的回來 */
    if (router.pathname === '/cart/order/callback') {
      return
    }

    const oldToken = localStorage.getItem('TheToken') // 從 localStorage 中取得舊的 token

    // console.log('舊的 token ', oldToken)
    ;(async () => {
      if (oldToken) {
        let newToken, error
        const url = 'http://localhost:3005/api/user/status'

        // 透過 API 驗證舊的 token 並獲取新的 token
        newToken = await fetch(url, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${oldToken}`,
          },
        })
          .then((res) => res.json())
          .then((result) => {
            if (result.status === 'success') {
              // console.log('新的 token ', result.token)
              return result.token // 返回一個新的 token
            } else {
              throw new Error(result.message)
            }
          })
          .catch((err) => {
            error = err
            console.log('token解構錯誤: ', err)
            return undefined
          })

        if (error) {
          alert(error.message)
          return
        }
        if (newToken) {
          // 如果獲取到新的 token，更新狀態並存入 localStorage
          setToken(newToken)
          // localStorage.setItem('nextBenToken', newToken)
        }
      }
    })()
  }, [])

  // 檢查 token 是否有效的函數
  // const checkToken = async (token) => {
  //     const secretKey = "xxx";
  //     let decoded;

  //     let user = jwt.decode(token); //解析token的東西
  //     // console.log("rrerfef ",user);

  //     try {
  //         decoded = await new Promise((resolve, reject) => {
  //             console.log("送進來的 ", token);
  //             // 下列東西完全沒反應
  //             jwt.verify(token, secretKey, (error, data) => {
  //                 if (error) {
  //                     console.log("解析錯誤", err);
  //                     return reject(error);
  //                 }
  //                 console.log("解析成功",data);
  //                 return resolve(data);
  //             });
  //         });

  //         console.log("decoded 是: ", decoded);
  //     } catch (err) {
  //         decoded = {};
  //     }

  //     return decoded;
  // }

  // 返回 AuthContext.Provider 組件，並將 user、setUser、token 和 setToken 作為上下文的值傳遞給子組件

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, setToken, isAllowed, setIsAllowed }}
    >
      {children}
    </AuthContext.Provider>
  )
}
