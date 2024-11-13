import React, { useState, useCallback, useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'

// 自定義的 Modal 組件，負責圖片裁剪的功能
export default function CustomModal({ show, handleClose }) {
  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <h1>大頭貼變更</h1>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h1>內容</h1>
      </Modal.Body>
    </Modal>
  )
}
