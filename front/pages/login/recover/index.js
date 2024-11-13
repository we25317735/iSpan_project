import React, { useState, useEffect } from 'react'
import styles from './assets/style/style.module.scss'
import { Container, Card, Form, Button } from 'react-bootstrap'
import { useRouter } from 'next/router' // 切換路由
import axios from 'axios'
import { FaCheckCircle } from 'react-icons/fa' // 引入勾勾圖示

// GotBrew 好朋友
import GotBrew_friend1 from './assets/img/12.png'
import GotBrew_friend2 from './assets/img/13.png'

import Header from '@/components/Header'

export default function Recover() {
  const [text, setText] = useState('')
  const [confirmText, setConfirmText] = useState('') // 第二個密碼框
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [queryParams, setQueryParams] = useState({
    id: '',
    name: '',
    account: '',
  })

  const router = useRouter() // 初始化 router

  useEffect(() => {
    // 取得 URL 查詢參數
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id') || ''
    const name = params.get('name') || ''
    const account = params.get('account') || ''

    // 打印查詢參數
    console.log('URL 查詢參數:', { id, name, account })

    // 更新 state
    setQueryParams({ id, name, account })
  }, [])

  // 取得密碼輸入
  const handleTextChange = (event) => {
    const value = event.target.value
    setText(value)
    setIsPasswordValid(value.length >= 5)
    if (value.length >= 5) {
      setConfirmText('') // 清空第二個密碼框
    }
  }

  // 取得確認密碼輸入
  const handleConfirmTextChange = (event) => {
    setConfirmText(event.target.value)
  }

  const recover = (event) => {
    event.preventDefault() // 阻止表單的預設提交行為

    // 確認兩個密碼框的內容是否一致
    if (text !== confirmText) {
      alert('密碼不一致')
      setConfirmText('')
      return
    } else if (text === '') {
      return
    }

    let data = {
      user_id: queryParams.id,
      text: text,
    }

    // console.log('要更改成: ', data)

    axios
      .post('http://localhost:3005/api/user/recover', data)
      .then((response) => {
        console.log('密碼修改成功', response.data)
        alert('修改成功')
        router.push('http://localhost:3000/IGotBrew')
      })
      .catch((error) => {
        console.error('密碼修改失敗', error)
      })
  }

  return (
    <div id={`${styles['Recover-bg']}`} className="position-relative">
      {/* <Header /> */}
      <Container className="d-flex justify-content-center align-items-center vh-100">
        <Card className={`p-4 ${styles.customCard}`}>
          <Card.Body className="d-flex flex-column align-items-center">
            <Card.Title className={` ${styles['card-title']} text-center mb-3`}>
              I Got Brew
            </Card.Title>
            <Card.Subtitle className="mb-4 text-muted text-center">
              幫你找回帳號
            </Card.Subtitle>
            <Form className="w-100 mt-5" onSubmit={recover}>
              <Form.Group className="d-flex" controlId="formBasicText">
                <Form.Control
                  type="password"
                  name="text"
                  placeholder="請輸入你的新密碼"
                  className={`${styles.customInput} mx-5`}
                  style={{ height: '60px', fontSize: '30px' }}
                  value={text}
                  onChange={handleTextChange}
                />
                {isPasswordValid && (
                  <FaCheckCircle
                    className={`${styles.checkIcon} mt-3`}
                    size={30}
                    style={{
                      color: 'green',
                      position: 'relative',
                      // right: '15px',
                      // top: '15px',
                    }}
                  />
                )}
              </Form.Group>

              <Form.Group controlId="formConfirmText" className="mt-3 d-flex">
                <Form.Control
                  type="password"
                  name="confirmText"
                  placeholder={isPasswordValid ? '請再次輸入你的密碼' : null}
                  className={`${styles.customInput} mx-5`}
                  style={{
                    height: '60px',
                    fontSize: '30px',
                    position: 'relative',
                  }}
                  value={confirmText}
                  onChange={handleConfirmTextChange}
                  disabled={!isPasswordValid}
                />
              </Form.Group>

              <div className="d-flex">
                <a
                  href="http://localhost:3000/IGotBrew"
                  className="mt-4 fs-5 ms-5"
                >
                  回到首頁
                </a>
                <Button
                  variant="primary"
                  type="submit"
                  className="d-block ms-auto me-5 mt-4 px-3 fs-5"
                >
                  送 出
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>

      <img
        src={GotBrew_friend1.src}
        className={`${styles['friend1']} d-none `}
        alt=""
      />
      <img
        src={GotBrew_friend2.src}
        className={`${styles['friend2']}   d-none`}
        alt=""
      />
    </div>
  )
}
