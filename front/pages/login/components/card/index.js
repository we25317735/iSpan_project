import React, { useState, useEffect, useContext } from 'react'
import styles from './assets/style/style.module.scss'
import bg from './assets/img/bg.png'
import axios from 'axios'
import { useRouter, Link } from 'next/router'
import { FaGooglePlus } from 'react-icons/fa'
import { MdEmail } from 'react-icons/md'
import jwt from 'jsonwebtoken'
import { AuthContext } from '@/context/AuthContext'
import Swal from 'sweetalert2'
import { MdOutlineMail } from 'react-icons/md'

import Google_btn from '../google_btn'
import Loading from '@/components/Loading2'

import { FaCircleCheck } from 'react-icons/fa6'

import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'

export default function Card() {
  const [isLoginSlideUp, setIsLoginSlideUp] = useState(false)
  const [isSignupSlideUp, setIsSignupSlideUp] = useState(true)
  const [retrieve, setRetrieve] = useState(null)
  const [forget_password, setforget_password] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(0)

  const router = useRouter()

  const [loginInfo, setLoginInfo] = useState({ account: '', password: '' })
  const [signupInfo, setSignupInfo] = useState({
    name: '',
    account: '',
    password: '',
    email: '',
  })

  const { setUser } = useContext(AuthContext)

  const loginApi = 'http://localhost:3005/api/user/login'
  const signupApi = 'http://localhost:3005/api/user/register'

  const LoginClick = () => {
    setIsLoginSlideUp(false)
    setIsSignupSlideUp(true)
  }

  const SignupClick = () => {
    setIsLoginSlideUp(true)
    setIsSignupSlideUp(false)
  }

  const Input_change = (event) => {
    const { name, value } = event.target

    if (isLoginSlideUp) {
      setSignupInfo((prevState) => ({
        ...prevState,
        [name]: value,
      }))
    } else {
      setLoginInfo((prevState) => ({
        ...prevState,
        [name]: value,
      }))
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const api = isLoginSlideUp ? signupApi : loginApi
    const data = isLoginSlideUp ? signupInfo : loginInfo

    axios
      .post(api, data)
      .then((res) => {
        if (res.status === 200 && res.data.status === 'success') {
          const token = res.data.token
          localStorage.setItem('TheToken', token)

          if (token) {
            let result = jwt.decode(token)
            if (result.account) {
              setUser(result)
            } else {
              setUser(undefined)
            }
          }

          setErr(0)
          switch_router()
        } else if (res.data.message === '註冊成功') {
          Swal.fire({
            icon: 'success',
            title: '註冊成功',
            confirmButtonText: '確定',
          }).then((result) => {
            if (result.isConfirmed) {
              location.reload()
            }
          })

          setSignupInfo({
            name: '',
            account: '',
            password: '',
            email: '',
          })
        } else if (res.data.err === '登入錯誤') {
          setRetrieve(res.data.message)
          throw new Error(res.data.message.name)
        }
      })
      .catch((error) => {
        if (error.response.data.message === '密碼錯誤') {
          Swal.fire({
            icon: 'error',
            title: '密碼錯誤',
            showConfirmButton: false,
            timer: 1500,
          })
          setErr(err + 1)
          setforget_password(true)
        }
        setRetrieve(error.response.data)
      })
  }

  if (err >= 3) {
    alert('您失敗了, 請確認後再試')
    router.push('http://localhost:3000/IGotBrew')
  }

  const switch_router = async () => {
    setLoading(true)
    await router.push('http://localhost:3000/IGotBrew')
    setLoading(false)
  }

  const recover = () => {
    let data = retrieve.data

    Swal.fire({
      icon: 'error',
      title: `${data.name} 忘記密碼?`,
      showCancelButton: true,
      confirmButtonText: '是的',
      cancelButtonText: '沒有',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: '信件已送出！',
          text: '請檢查您的信箱以完成下一步。',
        })

        const api = 'http://localhost:3005/user/email'
        axios
          .post(api, data)
          .then((res) => {
            console.log(res.data)
          })
          .catch((err) => {
            console.log('錯誤 ', err)
          })
      }
    })
  }

  return (
    <div
      className={`${styles['login-box']} mx-3 mt-5`}
      style={{
        maxWidth: '400px',
        height: '600px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className={`${styles['form-structor']}`}>
        <form onSubmit={handleSubmit}>
          <div
            className={`${styles.signup} ${
              isSignupSlideUp ? styles['slide-up'] : ''
            } `}
            onClick={SignupClick}
          >
            <h2
              className={`${styles['form-title']} text-dark`}
              id="signup"
              style={{ fontSize: '3rem' }}
            >
              註冊
            </h2>
            <div className={`${styles['form-holder']}  `}>
              <input
                name="name"
                type="text"
                className={`${styles.input} mb-3 fs-3`}
                style={{ height: '50px' }}
                placeholder="名字"
                value={isLoginSlideUp ? signupInfo.name : loginInfo.name}
                onChange={Input_change}
              />
              <input
                name="account"
                type="text"
                className={`${styles.input} mb-3 fs-3`}
                style={{ height: '50px' }}
                placeholder="帳號"
                value={isLoginSlideUp ? signupInfo.account : loginInfo.account}
                onChange={Input_change}
              />
              <input
                name="password"
                type="password"
                className={`${styles.input} mb-2 fs-3`}
                style={{ height: '50px' }}
                placeholder="密碼"
                value={
                  isLoginSlideUp ? signupInfo.password : loginInfo.password
                }
                onChange={Input_change}
              />
              <input
                name="email"
                type="email"
                className={`${styles.input} mb-2 fs-3`}
                style={{ height: '50px' }}
                placeholder="電子信箱 (請輸入電子信箱)"
                value={isLoginSlideUp ? signupInfo.email : loginInfo.email}
                onChange={Input_change}
              />
            </div>
            {retrieve ? (
              <p className="fs-5 text-danger">輸入錯誤: {retrieve.message}</p>
            ) : (
              <p className="fs-5"></p>
            )}
            <button type="submit" className={styles['submit-btn']}>
              註冊
            </button>

            {/* 一鍵輸入 */}
            <button
              className={`${styles['speed']} p-1 fs-6`}
              type="button"
              onClick={() =>
                setSignupInfo({
                  name: '張雨涵',
                  account: 'igotbrew666',
                  password: '111111',
                  email: 'gotbrwe@gmail.com',
                })
              }
            >
              新註冊會員
            </button>
          </div>
        </form>

        <form onSubmit={handleSubmit}>
          <div
            className={`${styles.login} ${
              isLoginSlideUp ? styles['slide-up'] : ''
            }`}
            onClick={LoginClick}
          >
            <div className={`${styles['center']}`}>
              <h2
                className={`${styles['form-title']} text-white mt-3`}
                id="login"
                style={{ fontSize: '3rem' }}
              >
                登入
              </h2>
              <div className={styles['form-holder']}>
                <input
                  name="account"
                  type="text"
                  className={`${styles.input} mb-3 fs-3`}
                  style={{ height: '50px' }}
                  placeholder="帳號"
                  value={loginInfo.account}
                  onChange={Input_change}
                />
                <input
                  name="password"
                  type="password"
                  className={`${styles.input} mb-2 fs-3`}
                  style={{ height: '50px' }}
                  placeholder="密碼"
                  value={loginInfo.password}
                  onChange={Input_change}
                />
              </div>

              <p className="text-white fs-5 mb-5">
                登入錯誤次數: <span>{err}</span>
              </p>

              <button type="submit" className={styles['submit-btn']}>
                Log in 登入
              </button>

              {forget_password ? (
                <div className="w-100 ">
                  <span
                    onClick={(e) => recover()}
                    className="text-white d-block text-end fs-4 "
                    style={{ cursor: 'pointer' }}
                  >
                    忘記密碼
                  </span>
                </div>
              ) : (
                <p className="fs-5 " style={{ visibility: 'hidden' }}>
                  忘記密碼//
                </p>
              )}

              {/* 在這裡新增 Google 登入按鈕 */}
              <div className="mt-4">
                <Google_btn />
              </div>

              {/* 一建登入 */}
              <div className="mt-5 p-2" style={{ position: 'absolute' }}>
                <button
                  className={`${styles['speed']} p-2 fs-5`}
                  type="button"
                  onClick={() =>
                    setLoginInfo({ account: 'igotbrew666', password: '111111' })
                  }
                >
                  新註冊會員
                </button>
                <button
                  className={`${styles['speed']} p-2 fs-5 ms-2`}
                  type="button"
                  onClick={() =>
                    setLoginInfo({ account: 'zhang5678', password: '111111' })
                  }
                >
                  一般使用者
                </button>
                <button
                  className={`${styles['speed']} p-2 fs-5 ms-2`}
                  type="button"
                  onClick={() =>
                    setLoginInfo({ account: 'bai56789', password: 'pass234' })
                  }
                >
                  管理員
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {loading ? <Loading /> : ''}
    </div>
  )
}
