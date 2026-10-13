// src/pages/ImpQuestionsPage.jsx
import { useState, useRef } from 'react'
import { Plus, Star, Upload, Trash2, Edit2, HelpCircle } from 'lucide-react'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { useImpQuestions } from '../hooks/useFirestore'
import {
  PageHeader, Card, Button, Badge, Modal, ConfirmDialog,
  Input, Textarea, Select, Toggle, TableSkeleton, EmptyState
} from '../components/ui/index'

const DIFFICULTY_COLORS = { easy: 'green', medium: 'yellow', hard: 'red' }
const TYPE_COLORS        = { MCQ: 'blue', Theory: 'purple', Numerical: 'orange' }

function QuestionForm({ q, onClose, onSave }) {
  const [type, setType]         = useState(q?.type ?? 'MCQ')
  const [difficulty, setDiff]   = useState(q?.difficulty ?? 'medium')
  const [mustPractice, setMP]   = useState(q?.mustPractice ?? false)
  const [options, setOptions]   = useState(q?.options ?? ['', '', '', ''])
  const [correct, setCorrect]   = useState(q?.correctIndex ?? 0)
  const [subject, setSubject]   = useState(q?.subject ?? '')
  const [topic, setTopic]       = useState(q?.topic ?? '')
  const [question, setQuestion] = useState(q?.question ?? '')
  const [answer, setAnswer]     = useState(q?.answer ?? '')
  const [saving, setSaving]     = useState(false)

  async function handleSave() {
    if (!question.trim()) return toast.error('Question is required')
    setSaving(true)
    try {
      await onSave({
        subject, topic, type, difficulty, mustPractice, question, answer,
        ...(type === 'MCQ' ? { options, correctIndex: correct } : {}),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Mathematics" />
        <Input label="Topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Calculus" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Type" value={type} onChange={e => setType(e.target.value)}
          options={['MCQ','Theory','Numerical'].map(v => ({ value: v, label: v }))} />
        <Select label="Difficulty" value={difficulty} onChange={e => setDiff(e.target.value)}
          options={['easy','medium','hard'].map(v => ({ value: v, label: v }))} />
      </div>
      <Textarea label="Question *" value={question} onChange={e => setQuestion(e.target.value)} rows={3} />
      {type === 'MCQ' && (
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">Options</label>
          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  className="accent-blue-600"
                />
                <input
                  value={opt}
                  onChange={e => setOptions(opts => opts.map((o, j) => j === i ? e.target.value : o))}
                  placeholder={`Option ${i+1}`}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <Textarea label="Answer / Explanation" value={answer} onChange={e => setAnswer(e.target.value)} rows={3} />
      <Toggle checked={mustPractice} onChange={setMP} label="Mark as Must Practice ★" />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} loading={saving}>{q ? 'Update' : 'Add Question'}</Button>
      </div>
    </div>
  )
}

export default function ImpQuestionsPage() {
  const { docs: questions, loading, add, update, remove } = useImpQuestions()
  const [formOpen, setFormOpen]   = useState(false)
  const [editQ, setEditQ]         = useState(null)
  const [deleteTarget, setDelete] = useState(null)
  const [subjectFilter, setSubF]  = useState('')
  const [typeFilter, setTypeF]    = useState('All')
  const [diffFilter, setDiffF]    = useState('All')
  const csvRef = useRef()

  const filtered = questions.filter(q => {
    if (subjectFilter && !q.subject?.toLowerCase().includes(subjectFilter.toLowerCase())) return false
    if (typeFilter !== 'All' && q.type !== typeFilter) return false
    if (diffFilter !== 'All' && q.difficulty !== diffFilter) return false
    return true
  })

  function downloadCSVTemplate() {
    const csv = 'subject,topic,type,difficulty,question,answer,option1,option2,option3,option4,correctIndex,mustPractice\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'questions_template.csv'
    a.click()
  }

  async function handleCSVImport(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        let count = 0
        for (const row of data) {
          await add({
            subject: row.subject, topic: row.topic, type: row.type,
            difficulty: row.difficulty, question: row.question, answer: row.answer,
            mustPractice: row.mustPractice === 'true',
            ...(row.type === 'MCQ' ? {
              options: [row.option1, row.option2, row.option3, row.option4],
              correctIndex: Number(row.correctIndex ?? 0),
            } : {}),
          })
          count++
        }
        toast.success(`Imported ${count} questions!`)
      },
      error: e => toast.error('CSV parse error: ' + e.message),
    })
    e.target.value = ''
  }

  async function handleSave(data) {
    if (editQ) {
      await update(editQ.id, data)
      toast.success('Question updated!')
    } else {
      await add(data)
      toast.success('Question added!')
    }
  }

  return (
    <>
      <PageHeader
        title="IMP Questions"
        count={questions.length}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={downloadCSVTemplate}>
              <Upload size={14} /> CSV Template
            </Button>
            <Button variant="secondary" onClick={() => csvRef.current?.click()}>
              <Upload size={14} /> Import CSV
            </Button>
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCSVImport} />
            <Button onClick={() => { setEditQ(null); setFormOpen(true) }}>
              <Plus size={15} /> Add Question
            </Button>
          </div>
        }
      />

      {/* Filter Bar */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={subjectFilter}
          onChange={e => setSubF(e.target.value)}
          placeholder="Filter by subject…"
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm w-full sm:w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={typeFilter} onChange={e => setTypeF(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none">
          {['All','MCQ','Theory','Numerical'].map(v => <option key={v}>{v}</option>)}
        </select>
        <select value={diffFilter} onChange={e => setDiffF(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1 sm:flex-none">
          {['All','easy','medium','hard'].map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={6} cols={6} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={HelpCircle} title="No questions found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { label: '#',          cls: '' },
                    { label: 'Question',   cls: '' },
                    { label: 'Subject',    cls: 'hidden sm:table-cell' },
                    { label: 'Type',       cls: 'hidden sm:table-cell' },
                    { label: 'Difficulty', cls: 'hidden md:table-cell' },
                    { label: '★',          cls: 'hidden sm:table-cell' },
                    { label: 'Actions',    cls: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${h.cls}`}>{h.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((q, i) => (
                  <tr key={q.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                    <td className="py-3 px-4 text-sm text-gray-400">{i+1}</td>
                    <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{q.question}</td>
                    <td className="py-3 px-4 text-sm text-gray-500 hidden sm:table-cell">{q.subject ?? '—'}</td>
                    <td className="py-3 px-4 hidden sm:table-cell"><Badge variant={TYPE_COLORS[q.type] ?? 'gray'}>{q.type ?? '—'}</Badge></td>
                    <td className="py-3 px-4 hidden md:table-cell"><Badge variant={DIFFICULTY_COLORS[q.difficulty] ?? 'gray'}>{q.difficulty ?? '—'}</Badge></td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {q.mustPractice && <Star size={14} className="text-yellow-400 fill-yellow-400" />}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setEditQ(q); setFormOpen(true) }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => setDelete(q)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 size={13} />
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

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editQ ? 'Edit Question' : 'Add Question'} size="lg">
        <QuestionForm q={editQ} onClose={() => setFormOpen(false)} onSave={handleSave} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDelete(null)}
        onConfirm={async () => { await remove(deleteTarget.id); toast.success('Deleted'); setDelete(null) }}
        title="Delete Question"
        message="Delete this question permanently?"
      />
    </>
  )
}
