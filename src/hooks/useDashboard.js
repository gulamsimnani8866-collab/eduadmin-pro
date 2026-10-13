// src/hooks/useDashboard.js
import { useState, useEffect } from 'react'
import { collection, getCountFromServer, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../lib/firebase'

export function useDashboard() {
  const [stats,   setStats]   = useState({})
  const [loading, setLoading] = useState(true)
  const [recentCourses, setRecentCourses] = useState([])
  const [monthlyEnrollments, setMonthlyEnrollments] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [courses, users, purchases, liveClasses] = await Promise.all([
          getCountFromServer(collection(db, 'courses')),
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'purchases')),
          getCountFromServer(query(
            collection(db, 'liveClasses'),
            where('status', '==', 'scheduled')
          )),
        ])

        // Revenue from successful purchases
        const revSnap = await getDocs(query(
          collection(db, 'purchases'),
          where('status', '==', 'success')
        ))
        const revenue = revSnap.docs.reduce((sum, d) => sum + (d.data().amount ?? 0), 0)

        setStats({
          totalCourses:   courses.data().count,
          totalStudents:  users.data().count,
          totalPurchases: purchases.data().count,
          upcomingClasses:liveClasses.data().count,
          revenue,
        })

        // Recent courses
        const recent = await getDocs(query(
          collection(db, 'courses'),
          orderBy('createdAt', 'desc'),
          limit(5)
        ))
        setRecentCourses(recent.docs.map(d => ({ id: d.id, ...d.data() })))

        // Mock monthly enrollment trend (replace with real aggregation)
        setMonthlyEnrollments([
          { month: 'Jan', enrollments: 42 },
          { month: 'Feb', enrollments: 65 },
          { month: 'Mar', enrollments: 58 },
          { month: 'Apr', enrollments: 89 },
          { month: 'May', enrollments: 112 },
          { month: 'Jun', enrollments: 94 },
          { month: 'Jul', enrollments: 130 },
        ])
      } catch (e) {
        console.error('[Dashboard]', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { stats, loading, recentCourses, monthlyEnrollments }
}
