// src/pages/StudyMaterialsPage.jsx — Study Materials & PDF Repository (Exact Firestore Schema)
import { useState, useMemo, useRef } from 'react'
import {
  Plus, FileText, Download, Trash2, ExternalLink, CheckCircle2,
  HardDrive, Search, Edit2, BookOpen, Calendar
} from 'lucide-react'
import { addDoc, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { db } from '../lib/firebase'
import { formatFirestoreDate } from '../lib/date'
import { useStudyMaterials, useCourses, useUpload } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, SlideOver, ConfirmDialog,
  Input, Toggle, TableSkeleton, EmptyState, Tabs
} from '../components/ui/index'
import PdfUploadField, { CourseSelectField } from '../components/ui/PdfUploadField'

export default function StudyMaterialsPage() {
  const { docs: materials, loading, remove } = useStudyMaterials({
    orderByField: 'uploadedAt',
    orderDir: 'desc',
  })
  const { docs: courses } = useCourses()
  const { upload, progress, uploading } = useUpload()
  const fileInputRef = useRef(null)

  const [filter, setFilter] = useState('All')
  const [courseFilter, setCourseFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Form states matching exact Firestore schema:
  // chapterNumber, courseId, downloadCount, isPublished, pdfUrl, title, uploadedAt, year
  const [title, setTitle] = useState('')
  const [courseId, setCourseId] = useState('')
  const [chapterNumber, setChapterNumber] = useState('1')
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [isPublished, setIsPublished] = useState(true)
  const [pdfUrl, setPdfUrl] = useState('')
  const [matFile, setMatFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const courseNameMap = useMemo(() => {
    const map = {}
    courses.forEach(c => {
      map[c.id] = c.title || c.id
    })
    return map
  }, [courses])

  const filtered = useMemo(() => {
    return materials.filter(m => {
      if (filter === 'Published' && !m.isPublished) return false
      if (filter === 'Draft' && m.isPublished) return false
      if (courseFilter !== 'All' && m.courseId !== courseFilter) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const tMatch = m.title?.toLowerCase().includes(q)
        const cMatch = (courseNameMap[m.courseId] || m.courseId || '').toLowerCase().includes(q)
        const chMatch = String(m.chapterNumber ?? '').includes(q)
        const yMatch = String(m.year ?? '').includes(q)
        if (!tMatch && !cMatch && !chMatch && !yMatch) return false
      }
      return true
    })
  }, [materials, filter, courseFilter, search, courseNameMap])

  const totalDownloads = materials.reduce((acc, m) => acc + (Number(m.downloadCount) || 0), 0)
  const publishedCount = materials.filter(m => Boolean(m.isPublished)).length

  function openCreateDrawer() {
    setEditingMaterial(null)
    setTitle('')
    setCourseId(courses[0]?.id || '')
    setChapterNumber('1')
    setYear(String(new Date().getFullYear()))
    setIsPublished(true)
    setPdfUrl('')
    setMatFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDrawerOpen(true)
  }

  function openEditDrawer(item) {
    setEditingMaterial(item)
    setTitle(item.title || '')
    setCourseId(item.courseId || courses[0]?.id || '')
    setChapterNumber(String(item.chapterNumber ?? 1))
    setYear(String(item.year ?? new Date().getFullYear()))
    setIsPublished(item.isPublished !== undefined ? Boolean(item.isPublished) : true)
    setPdfUrl(item.pdfUrl || item.fileUrl || '')
    setMatFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setDrawerOpen(true)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setMatFile(file)
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '))
    }
  }

  async function handleSave(addAnother = false) {
    if (!title.trim()) return toast.error('Please enter a title')
    if (!courseId.trim()) return toast.error('Please select or enter a courseId')

    const parsedChapter = Number(chapterNumber)
    const parsedYear = Number(year)
    if (!Number.isFinite(parsedChapter) || parsedChapter < 0) {
      return toast.error('Please enter a valid chapter number')
    }
    if (!Number.isFinite(parsedYear) || parsedYear < 2000) {
      return toast.error('Please enter a valid year')
    }
    if (!matFile && !pdfUrl.trim()) {
      return toast.error('Please upload a PDF/file or provide a PDF URL')
    }

    setSaving(true)
    try {
      let finalPdfUrl = pdfUrl.trim()

      if (matFile) {
        finalPdfUrl = await upload(
          matFile,
          `studyMaterials/${courseId.trim()}/ch_${parsedChapter}_${Date.now()}_${matFile.name}`
        )
      }

      // Exact Firestore document fields only — no extra fields added
      const payload = {
        chapterNumber: parsedChapter,
        courseId: courseId.trim(),
        downloadCount: editingMaterial
          ? (Number(editingMaterial.downloadCount ?? editingMaterial.downloads) || 0)
          : 0,
        isPublished: Boolean(isPublished),
        pdfUrl: finalPdfUrl,
        title: title.trim(),
        uploadedAt: serverTimestamp(),
        year: parsedYear,
      }

      if (editingMaterial) {
        // setDoc without merge removes any legacy extra fields on this document
        await setDoc(doc(db, 'studyMaterials', editingMaterial.id), payload)
        toast.success('Updated in Firebase database!')
        setDrawerOpen(false)
      } else {
        await addDoc(collection(db, 'studyMaterials'), payload)
        if (addAnother) {
          toast.success('Material saved! Ready for next document.')
          setTitle('')
          setChapterNumber(String(parsedChapter + 1))
          setPdfUrl('')
          setMatFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
        } else {
          toast.success('Material uploaded to Cloudinary & saved to Firebase!')
          setDrawerOpen(false)
        }
      }
    } catch (err) {
      toast.error('Failed to save material: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await remove(deleteTarget.id)
    setDeleteTarget(null)
  }

  const tabsConfig = [
    { id: 'All',       label: 'All Materials', count: materials.length },
    { id: 'Published', label: 'Published',     count: publishedCount },
    { id: 'Draft',     label: 'Unpublished',   count: materials.length - publishedCount },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Study Materials & Notes"
        description="Upload chapter PDFs to Cloudinary and save exact metadata URLs to Firebase"
        count={materials.length}
        action={
          <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
            Upload Material
          </Button>
        }
      />

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Documents</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{materials.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-600 border border-rose-200/60">
            <FileText size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Published</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{publishedCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Downloads</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalDownloads.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Download size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">File Storage</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">Cloudinary</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <HardDrive size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Tabs
            tabs={tabsConfig}
            activeTab={filter}
            onChange={setFilter}
          />

          <select
            value={courseFilter}
            onChange={e => setCourseFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          >
            <option value="All">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="relative pt-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, course, chapter number, or year..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {loading ? (
          <TableSkeleton rows={4} cols={7} />
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={FileText}
              title="No study materials found"
              description="Upload chapter PDFs or notes to Cloudinary and save them in Firebase."
              action={
                <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
                  Upload Material
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
                  <th className="py-3 px-4 text-center">Chapter</th>
                  <th className="py-3 px-4 text-center">Year</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Downloads</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border flex-shrink-0 bg-rose-50 border-rose-200">
                          <FileText size={16} className="text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 line-clamp-1">{item.title}</p>
                          {item.pdfUrl && (
                            <p className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]">
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
                        Ch. {item.chapterNumber ?? '—'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                      {item.year ?? '—'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={item.isPublished ? 'green' : 'gray'} size="xs" dot>
                        {item.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {(Number(item.downloadCount) || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} className="text-slate-400" />
                        {formatFirestoreDate(item.uploadedAt)}
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
                            title="Open PDF"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => openEditDrawer(item)}
                          className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Material"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Material"
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

      {/* SlideOver Drawer for Uploading / Editing Study Materials */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingMaterial ? 'Edit Study Material' : 'Upload Study Material'}
        subtitle="Saves file in Cloudinary and stores exact document schema in Firebase."
        width="sm:max-w-2xl"
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
          {/* Section 1: Material Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Chapter &amp; Course Details
              </h3>
            </div>

            <Input
              label="Title *"
              placeholder="e.g. तत्वों का वर्गीकरण एवं गुणधर्मों में आवर्तिता."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <CourseSelectField
              courseId={courseId}
              onChange={setCourseId}
              courses={courses}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Chapter Number *"
                type="number"
                min={0}
                value={chapterNumber}
                onChange={e => setChapterNumber(e.target.value)}
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
          </div>

          {/* Section 2: PDF / File Upload */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Upload PDF / File to Cloudinary
              </h3>
            </div>

            <PdfUploadField
              inputId="study-material-upload"
              fileInputRef={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,.zip"
              selectedFile={matFile}
              onFileSelect={handleFileSelect}
              uploading={uploading}
              progress={progress}
              pdfUrl={pdfUrl}
              onPdfUrlChange={setPdfUrl}
              selectLabel="Click to select PDF or image for Cloudinary"
              helperText="Automatically populated on save when uploading a file, or paste a direct PDF URL"
            />
          </div>

          {/* Section 3: Publishing */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Publishing Status
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <Toggle
                checked={isPublished}
                onChange={setIsPublished}
                label="Published (isPublished)"
                description="When enabled, students can view and download this PDF."
              />
            </div>
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
              <Button
                variant="secondary"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>

              {!editingMaterial && (
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
                {editingMaterial ? 'Save Changes' : 'Upload & Publish'}
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
        title="Delete Material"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  )
}
