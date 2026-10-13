// src/pages/SettingsPage.jsx
import { useState } from 'react'
import { User, Bell, Shield, Globe } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import toast from 'react-hot-toast'
import {
  PageHeader, Card, Button, Input, Toggle
} from '../components/ui/index'

export default function SettingsPage() {
  const { admin } = useAuthStore()
  const [name, setName]  = useState(admin?.name ?? '')
  const [email, setEmail]= useState(admin?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [notifPrefs, setNotifPrefs] = useState({
    enrollments: true,
    feedback: false,
    failedPayments: true,
  })

  async function saveProfile() {
    if (!admin?.uid) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'admins', admin.uid), { name, email })
      toast.success('Profile updated!')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Settings" />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <User size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Admin Profile</h2>
          </div>
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
                {name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{name || 'Admin'}</p>
                <p className="text-xs text-gray-400">Super Admin</p>
              </div>
            </div>
            <Input label="Display Name" value={name} onChange={e => setName(e.target.value)} />
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Button onClick={saveProfile} loading={saving}>Save Profile</Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Bell size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
          </div>
          <div className="space-y-3">
            <Toggle
              checked={notifPrefs.enrollments}
              onChange={v => setNotifPrefs(p => ({ ...p, enrollments: v }))}
              label="Email alerts for new enrollments"
            />
            <Toggle
              checked={notifPrefs.feedback}
              onChange={v => setNotifPrefs(p => ({ ...p, feedback: v }))}
              label="Email alerts for new feedback"
            />
            <Toggle
              checked={notifPrefs.failedPayments}
              onChange={v => setNotifPrefs(p => ({ ...p, failedPayments: v }))}
              label="Push notifications for failed payments"
            />
          </div>
        </Card>

        {/* Security */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">Security</h2>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">To change your password, use the Firebase Console or the password reset flow.</p>
            <Button variant="secondary" size="sm">Reset Password via Email</Button>
          </div>
        </Card>

        {/* About */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Globe size={16} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">About</h2>
          </div>
          <p className="text-sm text-gray-500">EduAdmin Pro v1.0.0</p>
          <p className="text-xs text-gray-400 mt-1">React 18 · Firebase v10 · Tailwind CSS v3</p>
        </Card>
      </div>
    </>
  )
}
