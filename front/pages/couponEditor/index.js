import React, { useState, useEffect } from 'react'
import axios from 'axios'
import styles from '@/styles/couponEditor.module.scss'
import { Modal } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6'
import Swal from 'sweetalert2'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import IconButton from '@mui/material/IconButton'
import Header from '@/components/Header'
import Loading from '@/components/Loading'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye'
import BackSelect from '@/components/backSelect'
import moment from 'moment/moment'

export default function CouponEditor() {
  const url = 'http://localhost:3005/api/couponEditor'
  const [data, setData] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showread, setShowread] = useState(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchData, setSearchData] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortOrder, setSortOrder] = useState('asc')
  const [formData, setFormData] = useState({
    coupon_id: '',
    type: '',
    qty: '',
    user_id: '',
    id: '',
  })
  const filterBySearchTerm = (data, term) => {
    const searchLower = term.toLowerCase()
    if (term.startsWith('user:')) {
      const userIdSearchTerm = searchLower.replace('user:', '').trim()
      return data.filter((item) =>
        item.user_id.toString().includes(userIdSearchTerm)
      )
    } else if (term.startsWith('name:')) {
      const couponNameSearchTerm = searchLower.replace('name:', '').trim()
      return data.filter((item) =>
        item.coupon_name.toLowerCase().includes(couponNameSearchTerm)
      )
    } else {
      return data.filter(
        (item) =>
          item.coupon_name.toLowerCase().includes(searchLower) ||
          item.user_id.toString().includes(searchLower)
      )
    }
  }
  const filteredData = filterBySearchTerm(data, searchTerm)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 8

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const [displayedCoupon, setDisplayedCoupon] = useState([])

  const doPageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }
  const sortedData = [...filteredData].sort((a, b) => {
    return sortOrder === 'asc' ? a.user_id - b.user_id : b.user_id - a.user_id
  })

  const doSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }
  const [firstSelectValue, setFirstSelectValue] = useState('')
  const [secondSelectData, setSecondSelectData] = useState([])
  const fetchData = async () => {
    try {
      const response = await axios.get(`${url}/selectcoupon`)
      setData(response.data)
      setSearchData([])
    } catch (err) {
      console.log(err)
    }
  }
  useEffect(() => {
    if (sortedData.length > 0) {
      const startIndex = (currentPage - 1) * itemsPerPage
      const endIndex = startIndex + itemsPerPage
      const paginatedCourses = sortedData.slice(startIndex, endIndex)
      if (
        JSON.stringify(displayedCoupon) !== JSON.stringify(paginatedCourses)
      ) {
        setDisplayedCoupon(paginatedCourses)
      }
    }
  }, [sortedData, currentPage])

  const renderPagination = () => {
    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <a
          key={i}
          onClick={() => doPageChange(i)}
          className={currentPage === i ? styles.active : ''}
          href="#"
        >
          {i}
        </a>
      )
    }
    return pages
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])
  useEffect(() => {
    fetchData()
  }, [])
  useEffect(() => {
    axios
      .get(`${url}/selectcoupon`)
      .then((res) => {
        setData(res.data)
      })
      .catch((err) => {
        console.log(err)
      })
  }, [])
  useEffect(() => {
    if (firstSelectValue) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${url}/getCouponsByType`, {
            params: { type: firstSelectValue },
          })
          setSecondSelectData(response.data)
        } catch (error) {
          console.error('錯誤:', error)
        }
      }

      fetchData()
    } else {
      setSecondSelectData([])
    }
  }, [firstSelectValue])

  const doChange = (e) => {
    const { name, value } = e.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }))
  }

  const doFirstSelectChange = (e) => {
    setFirstSelectValue(e.target.value)
  }
  const doSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.post(`${url}/addcoupon`, formData)
      console.log('成功:', response.data)
    } catch (error) {
      console.error('錯誤:', error)
    }
    fetchData()
    doCloseAdd()
    Swal.fire({
      icon: 'success',
      title: '新增成功',
      showConfirmButton: false,
      timer: 1500,
    })
  }
  const doSubmitUpdate = async (e) => {
    e.preventDefault()

    try {
      const response = await axios.put(`${url}/updateCoupon`, formData)
      console.log('成功:', response.data)
    } catch (error) {
      console.error('錯誤:', error)
    }

    Swal.fire({
      icon: 'success',
      title: '修改成功',
      showConfirmButton: false,
      timer: 1500,
    })
    fetchData()
    doCloseUpdate()
  }
  const doCloseAdd = () => {
    setFormData({
      coupon_id: '',
      type: '',
      qty: '',
      user_id: '',
      id: '',
    })
    setFirstSelectValue('')
    setShowAdd(false)
  }
  const doCloseUpdate = () => {
    setShowUpdate(false)
  }
  useEffect(() => {
    if (firstSelectValue) {
      const fetchData = async () => {
        try {
          const response = await axios.get(`${url}/getCouponsByType`, {
            params: { type: firstSelectValue },
          })
          setSecondSelectData(response.data)
        } catch (error) {
          console.error('錯誤:', error)
        }
      }

      fetchData()
    } else {
      setSecondSelectData([])
    }
  }, [firstSelectValue])
  const doShowAdd = () => {
    setFormData({
      coupon_id: '',
      type: '',
      qty: '',
      user_id: '',
      id: '',
    })
    setShowAdd(true)
  }
  const doShowUpdate = (item) => {
    setFormData({
      user_id: item.user_id,
      coupon_id: item.coupon_id,
      type: item.type,
      qty: item.coupon_quantity,
      id: item.id,
    })
    setFirstSelectValue(item.type)
    setShowUpdate(true)
  }
  const doClick = (data) => {
    setShowread(data)
    const formattedDate = moment(data.lastedit_time).format(
      'YYYY-MM-DD HH:mm:ss'
    )
    Swal.fire({
      title: ``,
      html: `
      <div>
      <h2>${data.coupon_name}</h2>
      </div>
        <div style="display: flex; flex-direction: column; align-items: flex-start;font-size:1.4rem;">
          <p>使用者： ${data.user_id}</p>  
          <p style="margin-top: 5px;"> 類別： ${
            data.type === 'percent' ? '折扣' : '折現'
          }</p>
          <p style="margin-top: 5px;">折數： ${
            data.type === 'percent' && data.value < 1
              ? `${Math.floor(data.value * 10)}折`
              : data.value + '元'
          }</p>
     
          <p style="margin-top: 5px;">數量： ${data.coupon_quantity}張</p>
          <p style="margin-top: 5px;">最後修改時間： ${formattedDate}</p>
        </div>
      `,
      icon: 'info',
      confirmButtonColor: '#2b4f61',
      customClass: {
        confirmButton: 'custom-ok',
      },
      didOpen: () => {
        const popup = document.querySelector('.custom-ok')
        if (popup) {
          popup.style.fontSize = '1.4rem'
          popup.style.padding = '7px 18px'
        }
      },
    })
  }
  const doDelete = async (userID, couponID) => {
    try {
      const result = await Swal.fire({
        icon: 'warning',
        title: '確定要刪除？',
        text: '',
        confirmButtonText: '確定',
        showCancelButton: true,
        cancelButtonText: '取消',
        confirmButtonColor: '#2b4f61',
        customClass: {
          confirmButton: 'swal2-confirm-custom',
          cancelButton: 'swal2-cancel-custom',
        },
        didOpen: () => {
          const confirmBtn = document.querySelector('.swal2-confirm-custom')
          const cancelBtn = document.querySelector('.swal2-cancel-custom')

          if (confirmBtn) {
            confirmBtn.style.fontSize = '16px'
            confirmBtn.style.padding = '7px 18px'
          }

          if (cancelBtn) {
            cancelBtn.style.fontSize = '16px'
            cancelBtn.style.padding = '7px 18px'
          }
        },
      })

      if (result.isConfirmed) {
        const response = await axios.delete(`${url}/deleteCoupon`, {
          params: {
            user_id: userID,
            coupon_id: couponID,
          },
        })

        setData((prevData) =>
          prevData.filter(
            (item) => !(item.user_id === userID && item.coupon_id === couponID)
          )
        )
        Swal.fire({
          icon: 'success',
          title: '刪除成功!',
          showConfirmButton: false,
          timer: 1000,
        })
        fetchData()
        console.log('刪除成功:', response.data)
      }
    } catch (error) {
      console.error(
        '刪除失敗:',
        error.response ? error.response.data : error.message
      )
    }
  }

  const doSubmitSearch = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.get(`${url}/searchCoupon`, {
        params: {
          query: searchTerm,
        },
      })

      const results = response.data.results

      if (results.length === 0) {
        setSearchData([])
      } else {
        setSearchData(results)
      }
      setCurrentPage(1)
    } catch (error) {
      console.error('搜尋失敗:', error)
    }
  }
  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }
  return (
    <>
      <BackSelect />
      <Modal
        className={`${styles.h4}`}
        show={showAdd}
        onHide={doCloseAdd}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className={`${styles.h2}`}>新增優惠券</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form action="" method="post" onSubmit={doSubmit}>
            <div>
              <div>
                使用者ID：
                <input
                  type="text"
                  name="user_id"
                  value={formData.user_id}
                  onChange={doChange}
                  required
                  className={`form-control mt-1 ${styles.h4}`}
                />
              </div>

              <div className="mt-2">
                優惠券類別：
                <div className="d-flex gap-3">
                  <div>
                    <select
                      className={`form-select ${styles.h4}`}
                      name="type"
                      value={firstSelectValue}
                      required
                      onChange={doFirstSelectChange}
                    >
                      <option value="">請選擇類別</option>
                      <option value="amount">折現</option>
                      <option value="percent">折扣</option>
                    </select>
                  </div>
                  <div>
                    <select
                      className={`form-select ${styles.h4}`}
                      name="coupon_id"
                      value={formData.coupon_id}
                      onChange={doChange}
                      disabled={!firstSelectValue}
                      required
                    >
                      <option value="">請選擇</option>
                      {secondSelectData.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                數量：
                <input
                  type="text"
                  name="qty"
                  required
                  className={`form-control mt-1 ${styles.h4}`}
                  value={formData.qty}
                  onChange={doChange}
                />
              </div>

              <div className="d-flex justify-content-center mt-3">
                <Button
                  variant="contained"
                  type="submit"
                  sx={{
                    borderColor: '#2B4f61',
                    color: 'white',
                    fontSize: '16px',
                    backgroundColor: '#2B4f61',
                    '&:hover': {
                      borderColor: '#e4960e',
                      backgroundColor: '#e4960e',
                      color: 'black',
                    },
                  }}
                >
                  送出
                </Button>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      <Modal
        className={`${styles.h4}`}
        show={showUpdate}
        onHide={doCloseUpdate}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className={`${styles.h2}`}>修改優惠券</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form action="" method="post" onSubmit={doSubmitUpdate}>
            <div>
              <div>
                使用者ID：
                <input
                  type="text"
                  name="user_id"
                  value={formData.user_id}
                  disabled
                  onChange={doChange}
                  className={`form-control mt-1 ${styles.h4}`}
                />
              </div>

              <div className="mt-2">
                優惠券類別：
                <div className="d-flex gap-3">
                  <div>
                    <select
                      className={`form-select ${styles.h4}`}
                      name="type"
                      value={firstSelectValue}
                      onChange={doFirstSelectChange}
                      required
                    >
                      <option value="">請選擇類別</option>
                      <option value="amount">折價</option>
                      <option value="percent">折數</option>
                    </select>
                  </div>
                  <div>
                    <select
                      required
                      className={`form-select ${styles.h4}`}
                      name="coupon_id"
                      value={formData.coupon_id}
                      onChange={doChange}
                      disabled={!firstSelectValue}
                    >
                      <option value="">請選擇</option>
                      {secondSelectData.map((item, index) => (
                        <option key={index} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-2">
                數量：
                <input
                  type="text"
                  name="qty"
                  required
                  className={`form-control mt-1 ${styles.h4}`}
                  value={formData.qty}
                  onChange={doChange}
                />
              </div>

              <div className="d-flex justify-content-center mt-3">
                <Button
                  variant="secondary"
                  type="submit"
                  sx={{
                    borderColor: '#2B4f61',
                    color: 'white',
                    fontSize: '16px',
                    backgroundColor: '#2B4f61',
                    '&:hover': {
                      borderColor: '#e4960e',
                      backgroundColor: '#e4960e',
                      color: 'black',
                    },
                  }}
                >
                  送出
                </Button>
              </div>
            </div>
          </form>
        </Modal.Body>
      </Modal>
      <div className={`g-0 container-fluid ${styles.couponEditor}`}>
        <Header />
        <div className={`text-center ${styles.cart} ${styles.h1}`}>
          優惠券後台系統
        </div>
        <div className="mx-2 mt-3 row justify-content-center">
          <div className="d-flex col-8 flex-column">
            <div className="mx-auto">
              <form className="d-flex" action="" onSubmit={doSubmitSearch}>
                <div>
                  <input
                    type="text"
                    name="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`form-control ${styles.h4}`}
                    placeholder="請輸入ID或優惠券名稱"
                  />
                </div>
                <div>
                  <Button
                    variant="contained"
                    type="submit"
                    sx={{
                      borderColor: '#2B4f61',
                      color: 'white',
                      fontSize: '14px',
                      backgroundColor: '#2B4f61',
                      '&:hover': {
                        borderColor: '#e4960e',
                        backgroundColor: '#e4960e',
                        color: 'black',
                      },
                    }}
                  >
                    搜尋
                  </Button>
                </div>
              </form>
            </div>

            <div className="d-flex justify-content-between">
              <div className={`d-flex align-items-end ${styles.h5}`}>
                共
                {filteredData.length > 0
                  ? filteredData.length
                  : filteredData.length}
                筆
              </div>
              <div className="mb-3">
                <Button
                  variant="contained"
                  type="submit"
                  onClick={doShowAdd}
                  sx={{
                    borderColor: '#2B4f61',
                    color: 'white',
                    fontSize: '16px',
                    backgroundColor: '#2B4f61',
                    '&:hover': {
                      borderColor: '#e4960e',
                      backgroundColor: '#e4960e',
                      color: 'black',
                    },
                  }}
                >
                  新增優惠券
                </Button>
              </div>
            </div>
            <div>
              <table
                className={`table border table table-hover text-center ${styles.h4} ${styles.tablearea}`}
              >
                <thead className={`${styles.area}`}>
                  <tr>
                    <th>
                      使用者ID
                      <button onClick={doSort} className={`${styles.btn}`}>
                        {sortOrder === 'asc' ? (
                          <ArrowUpwardIcon />
                        ) : (
                          <ArrowDownwardIcon />
                        )}
                      </button>
                    </th>
                    <th>優惠券名稱</th>
                    <th>優惠券類別</th>
                    <th>優惠券折數</th>
                    <th>優惠券張數</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="6">查無搜尋結果</td>
                    </tr>
                  ) : (
                    displayedCoupon.map((v, index) => (
                      <tr key={index}>
                        <td className="align-middle">{v.user_id}</td>
                        <td className="align-middle">{v.coupon_name}</td>
                        <td className="align-middle">
                          {v.type === 'percent' ? '折扣' : '折現'}
                        </td>
                        <td className="align-middle">
                          {v.type === 'percent' && v.value < 1
                            ? `${Math.floor(v.value * 10)}折`
                            : v.value + '元'}
                        </td>
                        <td className="align-middle">{v.coupon_quantity}張</td>
                        <td>
                          <div>
                            <IconButton aria-label="edit" size="large">
                              <EditIcon
                                onClick={() => doShowUpdate(v)}
                                fontSize="large"
                              />
                            </IconButton>
                            <IconButton aria-label="edit" size="large">
                              <RemoveRedEyeIcon
                                fontSize="large"
                                onClick={() => doClick(v)}
                              />
                            </IconButton>
                            <IconButton aria-label="delete" size="large">
                              <DeleteIcon
                                onClick={() => doDelete(v.user_id, v.coupon_id)}
                                fontSize="large"
                              />
                            </IconButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className={styles.pagination}>
          <a
            onClick={() => doPageChange(currentPage - 1)}
            className={currentPage === 1 ? styles.disabled : ''}
            href="#"
          >
            <FaAngleLeft />
          </a>
          {renderPagination()}
          <a
            onClick={() => doPageChange(currentPage + 1)}
            className={currentPage === totalPages ? styles.disabled : ''}
            href="#"
          >
            <FaAngleRight />
          </a>
        </div>
      </div>
    </>
  )
}
