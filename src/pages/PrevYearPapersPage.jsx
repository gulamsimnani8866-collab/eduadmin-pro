// src/pages/PrevYearPapersPage.jsx
import { useState } from 'react'
import { Plus, Download, Archive, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { usePrevYearPapers, useUpload } from '../hooks/useFirestore'
import { storagePaths, deleteFile } from '../lib/storage'
import {
  PageHeader, Card, Button, Modal, ConfirmDialog,
  Input, Select, FileUpload, TableSkeleton, EmptyState
} from '../components/ui/index'

export default function PrevYearPapersPage() {
  const { docs: papers, loading, add, remove } = usePrevYearPapers({ orderByField: 'year', orderDir: 'desc' })
  const { upload, progress: prog1, uploading: up1 } = useUpload()
  const { upload: upload2, progress: prog2, uploading: up2 } = useUpload()
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDT]   = useState(false)

  const [year, setYear]     = useState('')
  const [exam, setExam]     = useState('')
  const [subject, setSubj]  = useState('')
  const [board, setBoard]   = useState('')
  const [qFile, setQFile]   = useState(null)
  const [aFile, setAFile]   = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!year || !exam || !qFile) return toast.error('Year, Exam Name and Question Paper required')
    setSaving(true)
    try {
      const id = Date.now().toString()
      const [qUrl, aUrl] = await Promise.all([
        upload(qFile, storagePaths.paperFile(id, 'question')),
        aFile ? upload2(aFile, storagePaths.paperFile(id, 'answer')) : Promise.resolve(null),
      ])
      await add({ year: Number(year), exam, subject, board, questionPaperUrl: qUrl, answerKeyUrl: aUrl, downloads: 0 })
      toast.success('Paper added!')
      setFormOpen(false)
      setYear(''); setExam(''); setSubj(''); setBoard(''); setQFile(null); setAFile(null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Previous Year Papers"
        count={papers.length}
        action={<Button onClick={() => setFormOpen(true)}><Plus size={15} /> Add Paper</Button>}
      />

      <Card className="overflow-hidden p-0">
        {loading ? <div className="p-5"><TableSkeleton rows={5} cols={7} /></div>
        : papers.length === 0 ? <EmptyState icon={Archive} title="No papers yet" />
        : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Year','Exam Name','Subject','Board','Question Paper','Answer Key','Downloads','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {papers.map(p => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="py-3 px-4 text-sm font-bold text-gray-900">{p.year}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{p.exam}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{p.subject ?? '—'}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{p.board ?? '—'}</td>
                  <td className="py-3 px-4">
                    {p.questionPaperUrl
                      ? <a href={p.questionPaperUrl} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
                          <Download size={12} /> Download
                        </a>
                      : <span className="text-gray-400 text-sm">—</span>
                    }
                  </td>
                  <td className="py-3 px-4">
                    {p.answerKeyUrl
                      ? <a href={p.answerKeyUrl} target="_blank" rel="noopener noreferrer"
                           className="flex items-center gap-1 text-green-600 text-sm hover:underline">
                          <Download size={12} /> Download
                        </a>
                      : <span className="text-gray-400 text-sm">N/A</span>
                    }
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-500">{p.downloads ?? 0}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => setDT(p)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add Previous Year Paper" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Year *" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="2024" />
            <Input label="Exam Name *" value={exam} onChange={e => setExam(e.target.value)} placeholder="JEE Mains" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subject" value={subject} onChange={e => setSubj(e.target.value)} placeholder="Physics" />
            <Input label="Board / Authority" value={board} onChange={e => setBoard(e.target.value)} placeholder="NTA" />
          </div>
          <FileUpload label="Question Paper PDF *" accept=".pdf" onFile={setQFile} progress={up1 ? prog1 : undefined} />
          <FileUpload label="Answer Key PDF (optional)" accept=".pdf" onFile={setAFile} progress={up2 ? prog2 : undefined} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving || up1 || up2}>Add Paper</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDT(null)}
        onConfirm={async () => {
          if (deleteTarget.questionPaperUrl) await deleteFile(deleteTarget.questionPaperUrl).catch(() => {})
          if (deleteTarget.answerKeyUrl)     await deleteFile(deleteTarget.answerKeyUrl).catch(() => {})
          await remove(deleteTarget.id)
          toast.success('Paper deleted')
          setDT(null)
        }}
        title="Delete Paper"
        message="Delete this paper and its files?"
      />
    </>
  )
}
