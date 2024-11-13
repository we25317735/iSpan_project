import React, { useState, useEffect, useContext, useRef } from 'react'
import Header from '@/components/Header'
import Section1 from './section1'
import Section2 from './section2'
import Section3 from './section3'
import Section4 from './section4'
import Section4Phone from './section4Phone'
import Section5 from './section5'
import Section6 from './section6'
import Footer from '@/components/Footer'
import styles from './assets/style/style.module.scss'
import Loading from '@/components/Loading'
import { FaAngleUp } from 'react-icons/fa'
import { AuthContext } from '@/context/AuthContext'

export default function IGotBrew() {
  const { user } = useContext(AuthContext)
  const [showButton, setShowButton] = useState(false)
  const [data, setData] = useState([])
  const sectionsRef = useRef([])
  const [loading, setLoading] = useState(true)
  const [visibleSections, setVisibleSections] = useState({})
  const [allSectionsRendered, setAllSectionsRendered] = useState(false)

  const sections = [
    Section2,
    Section3,
    Section4,
    Section4Phone,
    Section5,
    Section6,
    Footer,
  ]

  useEffect(() => {
    if (user) {
      setData(user)
    }

    console.log('抓到使者: ', user)
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setShowButton(window.scrollY > 300)
    }

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleIntersect = (entries, observer) => {
    entries.forEach((entry) => {
      // console.log(
      //   `Section ${entry.target.dataset.index} 的交集狀態:`,
      //   entry.isIntersecting
      // )
      if (entry.isIntersecting) {
        const index = entry.target.dataset.index
        setVisibleSections((prev) => ({
          ...prev,
          [index]: true,
        }))
        observer.unobserve(entry.target) // 一旦可見則停止觀察
      }
    })
  }

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2,
  }

  useEffect(() => {
    if (allSectionsRendered) {
      // console.log('所有 section 元素已渲染，初始化 IntersectionObserver')
      const observer = new IntersectionObserver(handleIntersect, options)

      sectionsRef.current.forEach((section, index) => {
        if (section) {
          section.dataset.index = index.toString()
          observer.observe(section)
          // console.log(`正在觀察 section ${index}`)
        } else {
          // console.log(`Section ${index} is null or undefined`)
        }
      })

      return () => {
        sectionsRef.current.forEach((section) => {
          if (section) {
            observer.unobserve(section)
          }
        })
      }
    }
  }, [allSectionsRendered])

  useEffect(() => {
    // console.log('當前可見的 Sections:', visibleSections)
  }, [visibleSections])

  if (loading) {
    return (
      <div>
        <Loading />
      </div>
    )
  }

  return (
    <>
      <div className={`container-fluid ${styles['bg']}`}>
        <Header />
        <Section1 />
        {sections.map((Section, index) => (
          <div
            key={index}
            ref={(el) => {
              sectionsRef.current[index] = el
              // console.log(`Setting ref for section ${index}:`, el)
              if (
                sectionsRef.current.filter(Boolean).length === sections.length
              ) {
                setAllSectionsRendered(true)
              }
            }}
            className={`${styles.sectionWrapper} ${
              visibleSections[index] ? styles.visible : ''
            }`}
          >
            <Section />
          </div>
        ))}

        {showButton && (
          <button onClick={scrollToTop} className={`${styles.gototop} btn`}>
            <FaAngleUp />
            <br /> Top
          </button>
        )}
      </div>
    </>
  )
}
