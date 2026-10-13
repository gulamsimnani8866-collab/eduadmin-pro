// src/pages/SyllabusPage.jsx
import { useState, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, GripVertical, Save, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCourses } from '../hooks/useFirestore'
import { db } from '../lib/firebase'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import {
  PageHeader, Card, Button, Select, Input, Textarea,
  Modal, SlideOver, FileUpload
} from '../components/ui/index'
import { useUpload } from '../hooks/useFirestore'
import { storagePaths } from '../lib/storage'

function ChapterAccordion({ chapter, index, onAddTopic, onUpdateTitle }) {
  const [open, setOpen]   = useState(false)
  const [title, setTitle] = useState(chapter.title ?? '')

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
        onClick={() => setOpen(o => !o)}
      >
        <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
        {open ? <ChevronDown size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />}
        <input
          value={title}
          onChange={e => { e.stopPropagation(); setTitle(e.target.value); onUpdateTitle(index, e.target.value) }}
          onClick={e => e.stopPropagation()}
          className="flex-1 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none"
          placeholder="Chapter title"
        />
        <span className="text-xs text-gray-400">{chapter.topics?.length ?? 0} topics</span>
      </div>
      {open && (
        <div className="px-4 py-3 space-y-2">
          {(chapter.topics ?? []).map((topic, ti) => (
            <div key={ti} className="flex items-start gap-2 bg-white border border-gray-100 rounded-lg px-3 py-2">
              <GripVertical size={13} className="text-gray-300 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{topic.title}</p>
                {topic.description && <p className="text-xs text-gray-400 mt-0.5">{topic.description}</p>}
              </div>
            </div>
          ))}
          <Button size="sm" variant="ghost" onClick={() => onAddTopic(index)} className="text-blue-600">
            <Plus size={12} /> Add Topic
          </Button>
        </div>
      )}
    </div>
  )
}

export default function SyllabusPage() {
  const { docs: courses } = useCourses()
  const { upload, progress, uploading } = useUpload()
  const [selectedCourse, setSC] = useState('')
  const [chapters, setChapters] = useState([])
  const [loaded, setLoaded]     = useState(false)
  const [saving, setSaving]     = useState(false)
  const [topicModal, setTM]     = useState(null)   // { chapterIndex }
  const [newTopicTitle, setNTT] = useState('')
  const [newTopicDesc, setNTD]  = useState('')

  async function loadSyllabus(courseId) {
    setSC(courseId)
    setLoaded(false)
    if (!courseId) return
    try {
      const snap = await getDoc(doc(db, 'syllabus', courseId))
      setChapters(snap.exists() ? (snap.data().chapters ?? []) : [])
    } catch { setChapters([]) }
    setLoaded(true)
  }

  function updateChapterTitle(idx, title) {
    setChapters(cs => cs.map((c, i) => i === idx ? { ...c, title } : c))
  }

  function addChapter() {
    setChapters(cs => [...cs, { title: `Chapter ${cs.length + 1}`, topics: [] }])
  }

  async function addTopic(chapterIndex) {
    if (!newTopicTitle.trim()) return toast.error('Topic title required')
    setChapters(cs => cs.map((c, i) => i === chapterIndex
      ? { ...c, topics: [...(c.topics ?? []), { title: newTopicTitle, description: newTopicDesc }] }
      : c
    ))
    setTM(null); setNTT(''); setNTD('')
  }

  async function saveSyllabus() {
    if (!selectedCourse) return toast.error('Select a course first')
    setSaving(true)
    try {
      await setDoc(doc(db, 'syllabus', selectedCourse), {
        chapters,
        updatedAt: serverTimestamp(),
      }, { merge: true })
      toast.success('Syllabus saved!')
    } finally {
      setSaving(false)
    }
  }

  async function handlePdfUpload(file) {
    if (!selectedCourse) return toast.error('Select a course first')
    const url = await upload(file, storagePaths.syllabusPdf(selectedCourse))
    await setDoc(doc(db, 'syllabus', selectedCourse), { pdfUrl: url }, { merge: true })
    toast.success('PDF uploaded!')
  }

  return (
    <>
      <PageHeader title="Syllabus Builder" />

      <Card className="mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Select
              label="Select Course"
              options={[
                { value: '', label: 'Choose a course…' },
                ...courses.map(c => ({ value: c.id, label: c.title })),
              ]}
              value={selectedCourse}
              onChange={e => loadSyllabus(e.target.value)}
            />
          </div>
          {selectedCourse && (
            <div className="flex gap-2 pt-5">
              <Button size="sm" variant="secondary" onClick={addChapter}>
                <Plus size={13} /> Add Chapter
              </Button>
              <FileUpload
                label=""
                accept=".pdf"
                onFile={handlePdfUpload}
                progress={uploading ? progress : undefined}
              />
              <Button size="sm" onClick={saveSyllabus} loading={saving}>
                <Save size={13} /> Save
              </Button>
            </div>
          )}
        </div>
      </Card>

      {loaded && (
        <div className="space-y-3">
          {chapters.length === 0 ? (
            <Card>
              <p className="text-sm text-gray-400 text-center py-8">No chapters yet. Add your first chapter.</p>
            </Card>
          ) : (
            chapters.map((ch, i) => (
              <ChapterAccordion
                key={i}
                index={i}
                chapter={ch}
                onAddTopic={idx => setTM({ chapterIndex: idx })}
                onUpdateTitle={updateChapterTitle}
              />
            ))
          )}
        </div>
      )}

      {/* Add Topic Modal */}
      <Modal open={!!topicModal} onClose={() => setTM(null)} title="Add Topic" size="md">
        <div className="space-y-4">
          <Input label="Topic Title *" value={newTopicTitle} onChange={e => setNTT(e.target.value)} />
          <Textarea label="Description" value={newTopicDesc} onChange={e => setNTD(e.target.value)} rows={3} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setTM(null)}>Cancel</Button>
            <Button onClick={() => addTopic(topicModal?.chapterIndex)}>Add Topic</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
