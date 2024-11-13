import React, { useEffect, useState, useContext } from 'react'
import styles from './assets/style/style.module.scss'
import axios from 'axios'
import Swal from 'sweetalert2'

import bg_img from './assets/img/bg-noise.png'
import Header from '@/components/Header'
import List_btn from '../user_components/List_btn'
import CustomModal from './components/modal/index' // 引入簡化的 Modal 组件

import Loading from '@/components/Loading2' // 引入 Loading 組件

import { AuthContext } from '@/context/AuthContext'

export default function User_data() {
  const [edit_Control, setEdit_Control] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // const [isLoading, setIsLoading] = useState(true) // 控制是否顯示 Loading

  const [loading, setLoading] = useState(true)

  const { user, setUser } = useContext(AuthContext)
  const [editedUser, setEditedUser] = useState({}) // 抓到資料

  // 使用 useEffect 來監聽 user 變更
  // (應該改成抓資料庫)
  useEffect(() => {
    if (user) {
      let APIdata = user
      console.log('使用者: ', user[0])
      if (user && user.length > 0 && user[0].permissions == null) {
        APIdata = user[0]
      }

      axios.post('http://localhost:3005/user', APIdata).then((response) => {
        setEditedUser(response.data[0])
        // setIsLoading(false) // 資料抓取完成，關閉 Loading 畫面
      })
    }

    // console.log('使用者: ', user?.img)
  }, [user])

  // loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  // 切換資訊展示和編輯的狀態 + 狀態更新
  const user_edit = (e) => {
    setEdit_Control(!edit_Control)

    if (e.target.value === '完成') {
      console.log('變更後的使用者資料: ', editedUser)
      axios
        .put('http://localhost:3005/user/updata', editedUser)
        .then((response) => {
          console.log('更新成功', response.data)

          Swal.fire({
            icon: 'success',
            title: '修改成功',
            showConfirmButton: false,
            timer: 1500,
          })
        })
        .catch((error) => {
          console.error('更新失敗', error)
          alert('更新失敗')
        })
    }
  }

  // 放棄修改
  const GiveUp_edit = () => {
    Swal.fire({
      icon: 'warning',
      title: '放棄修改?',
      showCancelButton: true, // 顯示取消按鈕
      confirmButtonText: '確定',
      cancelButtonText: '取消', // 取消按鈕的文字
    }).then((result) => {
      if (result.isConfirmed) {
        location.reload() // 當按下「確定」時刷新頁面
      } else if (result.dismiss === Swal.DismissReason.cancel) {
        console.log('取消修改') // 當按下「取消」時執行的操作
      }
    })
  }

  const ModalClose = () => setShowModal(false)
  const handleModalShow = () => setShowModal(true)

  // 專門處理 input change
  const Input_chang = (e) => {
    const { name, value } = e.target
    setEditedUser((prev) => ({
      ...prev,
      [name]: value,
    }))
  }


  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  return (
    <div id={styles['user-page']}>
      <Header />
      <div className={` ${styles['bg-img']} `}></div>
      <div id={styles['user-data']} className=" mt-5">
        <h1 className="my-4 mt-5 mt-sm-5" style={{ fontSize: '4rem' }}>
          會員中心
        </h1>
        <div className={` ${styles['tab-box']}`}>
          <List_btn />

          <div
            id={`${styles['basic-info']}`}
            className="tab-content active"
            style={{ backgroundColor: '#fff' }}
          >
            <div
              className={`${styles['profile']} d-sm-flex justify-content-start pt-md-5`}
            >
              <div className={`${styles['profile-pic']} order-2 order-md-1`}>
                <img
                  src={`http://localhost:3005/images/user/${user?.img}`}
                  alt="使用者頭像"
                  onError={(e) => {
                    e.target.onerror = null // 防止循環觸發 onError
                    e.target.src = user?.img // 選擇預設圖片
                  }}
                />

                {edit_Control && (
                  <button
                    variant="primary"
                    onClick={handleModalShow}
                    className={styles['edit-pic-btn']}
                  >
                    ✎
                  </button>
                )}
              </div>

              <ul
                className={`${styles['input-box']} ms-4 ms-md-0 order-1 order-md-2`}
              >
                <li>
                  <div style={{ display: 'flex' }}>
                    <p className="pt-2 pt-sm-0">姓名</p>
                    {edit_Control ? (
                      <input
                        type="text"
                        name="name"
                        className="ps-sm-3"
                        value={editedUser.name}
                        onChange={Input_chang}
                        style={{ marginLeft: 50 }}
                      />
                    ) : (
                      <p style={{ marginLeft: 50 }}>
                        {editedUser.name || '查無此人'}
                      </p>
                    )}
                  </div>
                </li>
                <li>
                  <div style={{ display: 'flex' }}>
                    <p className="pt-2 pt-sm-0">生日</p>
                    {edit_Control ? (
                      <input
                        type="date"
                        name="birthday"
                        className="ps-sm-3"
                        value={editedUser.birthday}
                        onChange={Input_chang}
                        style={{ marginLeft: 50 }}
                      />
                    ) : (
                      <p style={{ marginLeft: 50 }}>
                        {editedUser.birthday || '沒有資料'}
                      </p>
                    )}
                  </div>
                </li>
                <li>
                  <div style={{ display: 'flex' }}>
                    <p className="pt-2 pt-sm-0">電話</p>
                    {edit_Control ? (
                      <input
                        type="text"
                        name="phone"
                        className="ps-sm-3"
                        value={editedUser.phone}
                        onChange={Input_chang}
                        style={{ marginLeft: 50 }}
                      />
                    ) : (
                      <p style={{ marginLeft: 50 }}>
                        {editedUser.phone || '沒有資料'}
                      </p>
                    )}
                  </div>
                </li>
                <li>
                  <div style={{ display: 'flex' }}>
                    <p
                      className="pt-2 pt-sm-0"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      信箱
                    </p>

                    {edit_Control ? (
                      <input
                        type="email"
                        name="email"
                        className="ps-sm-3"
                        value={editedUser.email}
                        onChange={Input_chang}
                        style={{ marginLeft: 50 }}
                        disabled={editedUser.email === '(Google_account)'}
                      />
                    ) : (
                      <p style={{ marginLeft: 50 }}>
                        {editedUser.email || '沒有資料'}
                      </p>
                    )}
                  </div>
                </li>
                <li>
                  <div style={{ display: 'flex' }}>
                    <p className="pt-2 pt-sm-0" style={{ textWrap: 'nowrap' }}>
                      地址
                    </p>
                    {edit_Control ? (
                      <input
                        type="text"
                        name="address"
                        className="ps-sm-3"
                        value={editedUser.address}
                        onChange={Input_chang}
                        style={{ marginLeft: 50 }}
                      />
                    ) : (
                      <p style={{ marginLeft: 50 }}>
                        {editedUser.address || '??(請問您現在的地址)'}
                      </p>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            <div className={`${styles['buttons']} mx-auto`}>
              {edit_Control ? (
                <button
                  className={`${styles['details-btn']}`}
                  variant="secondary"
                  onClick={GiveUp_edit}
                >
                  放棄修改
                </button>
              ) : null}

              <button
                className={`${styles['details-btn']} ms-5`}
                variant="primary"
                value={edit_Control ? '完成' : '編輯'}
                onClick={(e) => {
                  user_edit(e)
                }}
              >
                {edit_Control ? '完成' : '編輯'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <CustomModal show={showModal} handleClose={ModalClose} />
    </div>
  )
}
