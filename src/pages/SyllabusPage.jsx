// src/pages/SyllabusPage.jsx — Course Syllabus PDF Repository (Exact Firestore Schema)
import { useState, useMemo, useRef } from 'react'
import {
  Plus, FileText, Trash2, ExternalLink,
  HardDrive, Search, Edit2, BookOpen, Calendar
} from 'lucide-react'
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { db } from '../lib/firebase'
import { formatFirestoreDate } from '../lib/date'
import { useSyllabus, useCourses, useUpload } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, ConfirmDialog,
  Input, TableSkeleton, EmptyState
} from '../components/ui/index'
import PdfUploadField, { CourseSelectField } from '../components/ui/PdfUploadField'

export default function SyllabusPage() {
  const { docs: syllabi, loading, remove } = useSyllabus({
    orderByField: 'createdAt',
    orderDir: 'desc',
  })
  const { docs: courses } = useCourses()
  const { upload, progress, uploading } = useUpload()
  const fileInputRef = useRef(null)

  const [courseFilter, setCourseFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingSyllabus, setEditingSyllabus] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form states matching exact Firestore schema:
  // courseId, createdAt, pdfUrl, title, year
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [pdfUrl, setPdfUrl] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const courseNameMap = useMemo(() => {
    const map = {}
    courses.forEach(c => {
      map[c.id] = c.title || c.id
    })
    return map
  }, [courses])

  const filtered = useMemo(() => {
    return syllabi.filter(item => {
      if (courseFilter !== 'All' && item.courseId !== courseFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const tMatch = item.title?.toLowerCase().includes(q)
        const cMatch = (courseNameMap[item.courseId] || item.courseId || '').toLowerCase().includes(q)
        const yMatch = String(item.year ?? '').includes(q)
        if (!tMatch && !cMatch && !yMatch) return false
      }
      return true
    })
  }, [syllabi, courseFilter, search, courseNameMap])

  const uniqueCoursesCount = useMemo(
    () => new Set(syllabi.map(s => s.courseId).filter(Boolean)).size,
    [syllabi]
  )
  const latestYear = useMemo(() => {
    if (syllabi.length === 0) return new Date().getFullYear()
    return Math.max(...syllabi.map(s => Number(s.year) || 0)) || new Date().getFullYear()
  }, [syllabi])

  function openCreateDrawer() {
    setEditingSyllabus(null)
    setTitle('')
    setCourseId(courses[0]?.id || '')
    setYear(String(new Date().getFullYear()))
    setPdfUrl('')
    setPdfFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDrawerOpen(true)
  }

  function openEditDrawer(item) {
    setEditingSyllabus(item)
    setTitle(item.title || '')
    setCourseId(item.courseId || courses[0]?.id || '')
    setYear(String(item.year ?? new Date().getFullYear()))
    setPdfUrl(item.pdfUrl || '')
    setPdfFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDrawerOpen(true)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file)
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '))
    }
  }

  async function handleSave(addAnother = false) {
    if (!title.trim()) return toast.error('Please enter a syllabus title')
    if (!courseId.trim()) return toast.error('Please select or enter a courseId')

    const parsedYear = Number(year)
    if (!Number.isFinite(parsedYear) || parsedYear < 2000) {
      return toast.error('Please enter a valid year')
    }
    if (!pdfFile && !pdfUrl.trim()) {
      return toast.error('Please upload a syllabus PDF or provide a PDF URL')
    }

    setSaving(true)
    try {
      let finalPdfUrl = pdfUrl.trim()

      if (pdfFile) {
        finalPdfUrl = await upload(
          pdfFile,
          `syllabus/${courseId.trim()}/${Date.now()}_${pdfFile.name}`
        )
      }

      // Exact Firestore document fields only — no extra fields added
      const payload = {
        courseId: courseId.trim(),
        createdAt: editingSyllabus?.createdAt || serverTimestamp(),
        pdfUrl: finalPdfUrl,
        title: title.trim(),
        year: parsedYear,
      }

      if (editingSyllabus) {
        // setDoc without merge removes any legacy extra fields (e.g. chapters, updatedAt)
        await setDoc(doc(db, 'syllabus', editingSyllabus.id), payload)
        toast.success('Syllabus updated in Firebase database!')
        setDrawerOpen(false)
      } else {
        await addDoc(collection(db, 'syllabus'), payload)
        if (addAnother) {
          toast.success('Syllabus saved! Ready for next PDF.')
          setTitle('')
          setPdfUrl('')
          setPdfFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        } else {
          toast.success('Syllabus PDF uploaded to Cloudinary & saved to Firebase!')
          setDrawerOpen(false)
        }
      }
    } catch (err) {
      toast.error('Failed to save syllabus: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Course Syllabus"
        description="Upload syllabus PDFs to Cloudinary and save exact schema records to Firebase"
        count={syllabi.length}
        action={
          <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
            Upload Syllabus
          </Button>
        }
      />

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Syllabi</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{syllabi.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
            <FileText size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Courses Covered</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{uniqueCoursesCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <BookOpen size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Latest Year</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{latestYear}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <Calendar size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">PDF Storage</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">Cloudinary</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <HardDrive size={18} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by syllabus title, course, or year..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>

        <select
          value={courseFilter}
          onChange={e => setCourseFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
        >
          <option value="All">All Courses</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {loading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={BookOpen}
              title="No syllabus PDFs found"
              description="Upload a course syllabus PDF to Cloudinary and store its URL in Firebase."
              action={
                <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
                  Upload Syllabus
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4 text-center">Year</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border flex-shrink-0 bg-rose-50 border-rose-200">
                          <FileText size={16} className="text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 line-clamp-1">{item.title || 'Untitled Syllabus'}</p>
                          {item.pdfUrl && (
                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[240px]">
                              {item.pdfUrl}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-indigo-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {courseNameMap[item.courseId] || item.courseId || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="indigo" size="xs">
                        {item.year ?? '—'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {formatFirestoreDate(item.createdAt)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.pdfUrl && (
                          <a
                            href={item.pdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                            title="Open Syllabus PDF"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => openEditDrawer(item)}
                          className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Syllabus"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Syllabus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SlideOver Drawer for Uploading / Editing Syllabus */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingSyllabus ? 'Edit Syllabus' : 'Upload Syllabus PDF'}
        subtitle="Saves PDF in Cloudinary and stores exact document schema in Firebase."
        width="sm:max-w-xl"
      >
        <div
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSave(false)
            }
          }}
          className="space-y-6"
        >
          {/* Section 1: Syllabus Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Syllabus Details
              </h3>
            </div>

            <Input
              label="Title *"
              placeholder="e.g. JAC Board Syllabus"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <CourseSelectField
              courseId={courseId}
              onChange={setCourseId}
              courses={courses}
            />

            <Input
              label="Year *"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={e => setYear(e.target.value)}
            />
          </div>

          {/* Section 2: PDF Upload */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upload PDF to Cloudinary
              </h3>
            </div>

            <PdfUploadField
              inputId="syllabus-pdf-upload"
              fileInputRef={fileInputRef}
              selectedFile={pdfFile}
              onFileSelect={handleFileSelect}
              uploading={uploading}
              progress={progress}
              pdfUrl={pdfUrl}
              onPdfUrlChange={setPdfUrl}
              selectLabel="Click to select Syllabus PDF for Cloudinary"
            />
          </div>

          {/* Sticky Bottom Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 bg-white sticky bottom-0 -mb-6 -mx-6 px-6 py-4 shadow-lg">
            <span className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">
                Ctrl + Enter
              </kbd>
              to save immediately
            </span>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>

              {!editingSyllabus && (
                <Button
                  variant="secondary"
                  loading={saving || uploading}
                  onClick={() => handleSave(true)}
                  className="text-accent-700 hover:text-accent-800 border-accent-200 hover:bg-accent-50"
                >
                  Save &amp; Add Another
                </Button>
              )}

              <Button
                variant="primary"
                loading={saving || uploading}
                onClick={() => handleSave(false)}
              >
                {editingSyllabus ? 'Save Changes' : 'Upload & Publish'}
              </Button>
            </div>
          </div>
        </div>
      </SlideOver>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Syllabus"
        message={`Are you sure you want to delete "${deleteTarget?.title || 'this syllabus'}"?`}
      />
    </div>
  )
}
