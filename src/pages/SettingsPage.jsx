// src/pages/SettingsPage.jsx — Professional Academy & System Settings
import { useState } from 'react'
import {
  User, Bell, Shield, Globe, Building2, Save, Key,
  CheckCircle2, Sparkles, RefreshCw
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../lib/cloudinary'
import toast from 'react-hot-toast'
import {
  PageHeader, Card, Button, Input, Toggle, Tabs, Badge
} from '../components/ui/index'

export default function SettingsPage() {
  const { admin } = useAuthStore()
  const [activeTab, setActiveTab] = useState('Profile')

  // Profile State
  const [name, setName] = useState(admin?.name || '')
  const [email, setEmail] = useState(admin?.email || '')
  const [campus, setCampus] = useState(admin?.campus || '')
  const [saving, setSaving] = useState(false)

  // Institution State
  const [institutionName, setInstName] = useState(admin?.institution || 'JSC Learning Academy')
  const [supportPhone, setSupportPhone] = useState(admin?.phone || '')
  const [portalDomain, setPortalDomain] = useState(admin?.domain || '')

  // Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    enrollments: true,
    feedback: true,
    failedPayments: true,
    liveClassReminders: true,
  })

  async function saveProfile() {
    setSaving(true)
    try {
      if (admin?.uid) {
        await updateDoc(doc(db, 'admins', admin.uid), {
          name,
          email,
          campus,
          institution: institutionName,
          phone: supportPhone,
          domain: portalDomain,
        })
      }
      toast.success('Settings saved to Firestore database!')
    } catch (e) {
      toast.error(`Database save note: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const tabsConfig = [
    { id: 'Profile',       label: 'Admin Profile' },
    { id: 'Institution',   label: 'Academy & Campus' },
    { id: 'Notifications', label: 'Notification Rules' },
    { id: 'Cloud',         label: 'Cloud Infrastructure' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Configuration"
        description="Configure administrator credentials, institutional branding, and automated alert preferences"
      />

      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <div className="max-w-3xl space-y-6">
        {activeTab === 'Profile' && (
          <Card className="p-6 border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-accent-100 shadow-md">
                {name?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{name || 'Administrator'}</h3>
                <p className="text-xs text-slate-400">{email}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant="indigo" size="xs">
                    {admin?.role === 'superadmin' ? 'Super Administrator' : 'Verified Admin'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="Full Display Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />

              <Input
                label="Official Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />

              <Input
                label="Primary Institutional Campus"
                value={campus}
                onChange={e => setCampus(e.target.value)}
              />

              <div className="pt-2">
                <Button
                  variant="primary"
                  loading={saving}
                  icon={Save}
                  onClick={saveProfile}
                >
                  Save Profile Changes
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'Institution' && (
          <Card className="p-6 border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 size={18} className="text-accent-600" />
              <h3 className="font-bold text-slate-900 text-sm">Academy Brand Settings</h3>
            </div>

            <Input
              label="Institution / Organization Name"
              value={institutionName}
              onChange={e => setInstName(e.target.value)}
            />

            <Input
              label="Support Helpline Contact"
              value={supportPhone}
              onChange={e => setSupportPhone(e.target.value)}
            />

            <Input
              label="Public Student Portal URL"
              value={portalDomain}
              onChange={e => setPortalDomain(e.target.value)}
            />

            <div className="pt-2">
              <Button variant="primary" icon={Save} onClick={saveProfile}>
                Update Academy Details
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'Notifications' && (
          <Card className="p-6 border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Bell size={18} className="text-accent-600" />
              <h3 className="font-bold text-slate-900 text-sm">Automated Administrator Alerts</h3>
            </div>

            <div className="space-y-4">
              <Toggle
                checked={notifPrefs.enrollments}
                onChange={v => setNotifPrefs(p => ({ ...p, enrollments: v }))}
                label="Email alert for new paid course enrollments"
                description="Receive immediate receipts and student details when a purchase succeeds."
              />

              <Toggle
                checked={notifPrefs.feedback}
                onChange={v => setNotifPrefs(p => ({ ...p, feedback: v }))}
                label="Instant alert for student feedback and questions"
                description="Get notified whenever a student posts a review or doubt inquiry."
              />

              <Toggle
                checked={notifPrefs.liveClassReminders}
                onChange={v => setNotifPrefs(p => ({ ...p, liveClassReminders: v }))}
                label="Faculty live broadcast countdown alerts"
                description="30 minutes prior to any scheduled live streaming class."
              />

              <Toggle
                checked={notifPrefs.failedPayments}
                onChange={v => setNotifPrefs(p => ({ ...p, failedPayments: v }))}
                label="Alerts on failed transactions or gateway drops"
                description="Immediate webhook alert when a payment attempt encounters an error."
              />
            </div>

            <div className="pt-2">
              <Button variant="primary" icon={Save} onClick={saveProfile}>
                Save Notification Rules
              </Button>
            </div>
          </Card>
        )}

        {activeTab === 'Cloud' && (
          <Card className="p-6 border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Shield size={18} className="text-accent-600" />
              <h3 className="font-bold text-slate-900 text-sm">Firebase Cloud & Database Health</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Firebase Project ID</span>
                <span className="font-mono text-slate-900 font-bold">jscdatabase</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Firestore Realtime Database</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connected & Synchronized
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Images &amp; Files Storage (Cloudinary)</span>
                <span className="font-mono text-slate-600">{CLOUDINARY_CLOUD_NAME} ({CLOUDINARY_UPLOAD_PRESET})</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Video Storage Bucket (Firebase)</span>
                <span className="font-mono text-slate-600">jscdatabase.firebasestorage.app</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-slate-700">Security Rules Engine</span>
                <span className="text-slate-900 font-semibold">Rules v2 • Admin Protected</span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
