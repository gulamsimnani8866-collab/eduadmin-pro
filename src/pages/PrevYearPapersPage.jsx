// src/pages/PrevYearPapersPage.jsx — Professional Previous Year Question Papers (PYQ) Archive
import { useState, useMemo, useRef } from 'react'
import {
  Plus, Download, Archive, Trash2, Search, FileText,
  CheckCircle2, ExternalLink, Calendar, BookOpen, Upload, Check
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePrevYearPapers, useUpload } from '../hooks/useFirestore'
import { storagePaths, deleteFile } from '../lib/storage'
import {
  PageHeader, Card, Button, Badge, SlideOver, ConfirmDialog,
  Input, Select, TableSkeleton, EmptyState, Tabs
} from '../components/ui/index'

const EXAM_PRESETS = ['JEE Main', 'JEE Advanced', 'NEET UG', 'CBSE Class 12', 'CBSE Class 10', 'CUET UG']
const YEAR_PRESETS = [2025, 2024, 2023, 2022, 2021, 2020]
const SUBJECT_CHIPS = ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English']

export default function PrevYearPapersPage() {
  const { docs: papers, loading, add, remove } = usePrevYearPapers({ orderByField: 'year', orderDir: 'desc' })
  const { upload: uploadQ, progress: progQ, uploading: upQ } = useUpload()
  const { upload: uploadA, progress: progA, uploading: upA } = useUpload()

  const [search, setSearch] = useState('')
  const [examFilter, setExamFilter] = useState('All')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [deleteTarget, setDT] = useState(null)

  // Form states
  const [year, setYear]         = useState('2024')
  const [exam, setExam]         = useState('JEE Main')
  const [subject, setSubj]      = useState('Mathematics')
  const [board, setBoard]       = useState('NTA')
  const [qFile, setQFile]       = useState(null)
  const [aFile, setAFile]       = useState(null)
  const [directQUrl, setDirectQUrl] = useState('')
  const [directAUrl, setDirectAUrl] = useState('')
  const [saving, setSaving]     = useState(false)

  const qFileInputRef = useRef(null)
  const aFileInputRef = useRef(null)

  // Filtered papers
  const filtered = useMemo(() => {
    return papers.filter(p => {
      if (examFilter !== 'All' && p.exam !== examFilter) return false
      if (search.trim()) {
        const query = search.toLowerCase()
        const examMatch = p.exam?.toLowerCase().includes(query)
        const subMatch = p.subject?.toLowerCase().includes(query)
        const yrMatch = String(p.year || '').includes(query)
        if (!examMatch && !subMatch && !yrMatch) return false
      }
      return true
    })
  }, [papers, examFilter, search])

  // Aggregate stats
  const totalDownloads = papers.reduce((sum, p) => sum + (p.downloads || 0), 0)
  const withAnswerKeyCount = papers.filter(p => Boolean(p.answerKeyUrl)).length

  function openCreateDrawer() {
    setYear('2024')
    setExam('JEE Main')
    setSubj('Mathematics')
    setBoard('NTA')
    setQFile(null)
    setAFile(null)
    setDirectQUrl('')
    setDirectAUrl('')
    if (qFileInputRef.current) qFileInputRef.current.value = ''
    if (aFileInputRef.current) aFileInputRef.current.value = ''
    setDrawerOpen(true)
  }

  async function handleSave(addAnother = false) {
    if (!year || !exam) return toast.error('Year and Exam Name are required')
    if (!qFile && !directQUrl) return toast.error('Please upload or provide a Question Paper file')

    setSaving(true)
    try {
      const id = Date.now().toString()
      let qUrl = directQUrl
      let aUrl = directAUrl

      if (qFile) {
        qUrl = await uploadQ(qFile, storagePaths.paperFile(id, 'question'))
      }
      if (aFile) {
        aUrl = await uploadA(aFile, storagePaths.paperFile(id, 'answer'))
      }

      await add({
        year: Number(year),
        exam,
        subject,
        board: board || 'Official Authority',
        questionPaperUrl: qUrl || '#',
        answerKeyUrl: aUrl || null,
        downloads: 0,
      })

      if (addAnother) {
        toast.success('Paper added! Ready for next paper.')
        setQFile(null)
        setAFile(null)
        setDirectQUrl('')
        setDirectAUrl('')
        if (qFileInputRef.current) qFileInputRef.current.value = ''
        if (aFileInputRef.current) aFileInputRef.current.value = ''
      } else {
        toast.success('Previous year paper published!')
        setDrawerOpen(false)
      }
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.questionPaperUrl?.includes('firebasestorage')) {
        await deleteFile(deleteTarget.questionPaperUrl).catch(() => {})
      }
      if (deleteTarget.answerKeyUrl?.includes('firebasestorage')) {
        await deleteFile(deleteTarget.answerKeyUrl).catch(() => {})
      }
      await remove(deleteTarget.id)
      setDT(null)
    } catch (e) {
      toast.error('Failed to delete paper')
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Previous Year Question Papers (PYQs)"
        description="Repository of official past board exams, entrance questions, and verified solution keys"
        count={papers.length}
        action={
          <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
            Add PYQ Paper
          </Button>
        }
      />

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Archived Papers</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{papers.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60">
            <Archive size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">With Solution Keys</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{withAnswerKeyCount}</p>
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
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <Download size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Exam Years</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">2018 – 2025</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60">
            <Calendar size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setExamFilter('All')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                examFilter === 'All'
                  ? 'bg-accent-600 text-white border-accent-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              All Exams ({papers.length})
            </button>
            {EXAM_PRESETS.map(ep => {
              const count = papers.filter(p => p.exam === ep).length
              return (
                <button
                  key={ep}
                  onClick={() => setExamFilter(ep)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                    examFilter === ep
                      ? 'bg-accent-600 text-white border-accent-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {ep} {count > 0 && `(${count})`}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative pt-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search papers by exam name, year, or subject..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20"
          />
        </div>
      </div>

      {/* Papers Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80">
        {loading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : filtered.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Archive}
              title="No past papers found"
              description="Upload previous year exam papers with answer keys for student download."
              action={
                <Button variant="primary" icon={Plus} onClick={openCreateDrawer}>
                  Add PYQ Paper
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Exam Name</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Board / Authority</th>
                  <th className="py-3 px-4 text-center">Question Paper</th>
                  <th className="py-3 px-4 text-center">Answer Key</th>
                  <th className="py-3 px-4 text-center">Downloads</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filtered.map(paper => (
                  <tr key={paper.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                      {paper.year}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-accent-700">
                      {paper.exam}
                    </td>

                    <td className="py-3.5 px-4">
                      <Badge variant="indigo" size="xs">
                        {paper.subject || 'General'}
                      </Badge>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500">
                      {paper.board || 'Official'}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {paper.questionPaperUrl && paper.questionPaperUrl !== '#' ? (
                        <a
                          href={paper.questionPaperUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-accent-700 hover:underline bg-accent-50 px-2 py-1 rounded"
                        >
                          <Download size={12} /> Paper PDF
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {paper.answerKeyUrl ? (
                        <a
                          href={paper.answerKeyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline bg-emerald-50 px-2 py-1 rounded"
                        >
                          <Download size={12} /> Key / Sol
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                      {(paper.downloads || 0).toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setDT(paper)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Paper"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SlideOver Drawer for Adding Previous Year Papers */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add Previous Year Exam Paper"
        subtitle="Upload official question paper PDF and verified solution key to Cloudinary."
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
          {/* Section 1: Exam & Year */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Exam Classification & Year
              </h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Examination *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {EXAM_PRESETS.map(ep => (
                  <button
                    key={ep}
                    type="button"
                    onClick={() => setExam(ep)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition ${
                      exam === ep
                        ? 'bg-accent-50 text-accent-700 border-accent-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ep}
                  </button>
                ))}
              </div>
              <Input
                placeholder="Or custom examination name..."
                value={exam}
                onChange={e => setExam(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Exam Year *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {YEAR_PRESETS.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYear(String(y))}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition ${
                      String(year) === String(y)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                placeholder="2024"
                value={year}
                onChange={e => setYear(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject *
                </label>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {SUBJECT_CHIPS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSubj(s)}
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border transition ${
                        subject === s
                          ? 'bg-accent-50 text-accent-700 border-accent-300 font-bold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <Input
                  value={subject}
                  onChange={e => setSubj(e.target.value)}
                  placeholder="e.g. Physics"
                />
              </div>

              <Input
                label="Examination Authority / Board"
                placeholder="e.g. NTA, CBSE, State Board"
                value={board}
                onChange={e => setBoard(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: PDF Uploads to Cloudinary */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Paper & Answer Key Files
              </h3>
            </div>

            {/* Question Paper PDF */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                1. Official Question Paper (PDF) *
              </label>
              <input
                ref={qFileInputRef}
                type="file"
                accept=".pdf"
                onChange={e => setQFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 block w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100 cursor-pointer"
              />
              {qFile && (
                <p className="text-xs text-emerald-600 font-bold">
                  ✓ Selected: {qFile.name} ({(qFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              {upQ && (
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-accent-600 h-1.5" style={{ width: `${progQ}%` }} />
                </div>
              )}
              <Input
                placeholder="Or paste external PDF URL..."
                value={directQUrl}
                onChange={e => setDirectQUrl(e.target.value)}
              />
            </div>

            {/* Answer Key PDF */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                2. Answer Key / Solution Manual (PDF) (Optional)
              </label>
              <input
                ref={aFileInputRef}
                type="file"
                accept=".pdf"
                onChange={e => setAFile(e.target.files?.[0] || null)}
                className="text-xs text-slate-600 block w-full file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
              />
              {aFile && (
                <p className="text-xs text-emerald-600 font-bold">
                  ✓ Selected: {aFile.name} ({(aFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              )}
              {upA && (
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-600 h-1.5" style={{ width: `${progA}%` }} />
                </div>
              )}
              <Input
                placeholder="Or paste external Answer Key URL..."
                value={directAUrl}
                onChange={e => setDirectAUrl(e.target.value)}
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
              <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
                Cancel
              </Button>

              <Button
                variant="secondary"
                loading={saving || upQ || upA}
                onClick={() => handleSave(true)}
                className="text-accent-700 hover:text-accent-800 border-accent-200 hover:bg-accent-50"
              >
                Save & Add Another
              </Button>

              <Button
                variant="primary"
                loading={saving || upQ || upA}
                onClick={() => handleSave(false)}
              >
                Publish PYQ Paper
              </Button>
            </div>
          </div>
        </div>
      </SlideOver>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDT(null)}
        onConfirm={handleDelete}
        title="Delete Paper"
        message={`Delete the ${deleteTarget?.year} ${deleteTarget?.exam} paper?`}
      />
    </div>
  )
}
