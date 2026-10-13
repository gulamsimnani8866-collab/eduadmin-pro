// src/pages/CoursesPage.jsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCourses } from '../hooks/useFirestore'
import { useUpload }  from '../hooks/useFirestore'
import { storagePaths, deleteFile } from '../lib/storage'
import {
  PageHeader, Card, Button, Badge, Modal, ConfirmDialog,
  Input, Textarea, Select, Toggle, FileUpload, TableSkeleton, EmptyState
} from '../components/ui/index'

const FILTER_TABS = ['All', 'Free', 'Premium', 'Published', 'Draft']

const courseSchema = z.object({
  title:        z.string().min(3, 'Title is required'),
  description:  z.string().optional(),
  type:         z.enum(['free', 'premium']),
  price:        z.coerce.number().optional(),
  category:     z.string().optional(),
  instructor:   z.string().optional(),
  tags:         z.string().optional(),
  published:    z.boolean().optional(),
})

// ─── Desktop Table Row ──────────────────────────────────────────────────────

function CourseRow({ course, onEdit, onDelete }) {
  const typeVariant   = course.type === 'premium' ? 'purple' : 'blue'
  const statusVariant = course.published ? 'green' : 'gray'

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50 transition">
      <td className="py-3 px-4">
        {course.coverUrl ? (
          <img src={course.coverUrl} alt={course.title} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <BookOpen size={16} className="text-blue-600" />
          </div>
        )}
      </td>
      <td className="py-3 px-4">
        <p className="font-medium text-gray-900 text-sm">{course.title}</p>
        <p className="text-xs text-gray-400">{course.instructor ?? '—'}</p>
      </td>
      <td className="py-3 px-4 hidden sm:table-cell"><Badge variant={typeVariant}>{course.type ?? 'free'}</Badge></td>
      <td className="py-3 px-4 text-sm text-gray-600 hidden md:table-cell">{course.enrollments ?? 0}</td>
      <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell">{course.rating ? `★ ${course.rating}` : '—'}</td>
      <td className="py-3 px-4 hidden sm:table-cell"><Badge variant={statusVariant}>{course.published ? 'Published' : 'Draft'}</Badge></td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(course)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onDelete(course)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Mobile Card ────────────────────────────────────────────────────────────

function CourseMobileCard({ course, onEdit, onDelete }) {
  const typeVariant   = course.type === 'premium' ? 'purple' : 'blue'
  const statusVariant = course.published ? 'green' : 'gray'

  return (
    <div className="flex items-center gap-3 p-4 border-b border-gray-50 hover:bg-gray-50 transition">
      {course.coverUrl ? (
        <img src={course.coverUrl} alt={course.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
          <BookOpen size={18} className="text-blue-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{course.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{course.instructor ?? '—'}</p>
        <div className="flex gap-2 mt-1.5">
          <Badge variant={typeVariant}>{course.type ?? 'free'}</Badge>
          <Badge variant={statusVariant}>{course.published ? 'Published' : 'Draft'}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button onClick={() => onEdit(course)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition">
          <Edit2 size={14} />
        </button>
        <button onClick={() => onDelete(course)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Course Form ────────────────────────────────────────────────────────────

function CourseForm({ course, onClose, onSave }) {
  const { upload, progress, uploading } = useUpload()
  const [published, setPublished] = useState(course?.published ?? false)
  const [coverFile, setCoverFile] = useState(null)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title:      course?.title ?? '',
      description:course?.description ?? '',
      type:       course?.type ?? 'free',
      price:      course?.price ?? '',
      category:   course?.category ?? '',
      instructor: course?.instructor ?? '',
      tags:       course?.tags?.join(', ') ?? '',
      published:  course?.published ?? false,
    },
  })

  const courseType = watch('type')

  async function onSubmit(data) {
    try {
      let coverUrl = course?.coverUrl
      if (coverFile) {
        const id = course?.id ?? Date.now().toString()
        coverUrl = await upload(coverFile, storagePaths.courseCover(id))
      }
      await onSave({
        ...data,
        published,
        coverUrl: coverUrl ?? null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      })
      toast.success(course ? 'Course updated!' : 'Course created!')
      onClose()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input label="Title *" error={errors.title?.message} {...register('title')} placeholder="Course title" />
      <Textarea label="Description" {...register('description')} placeholder="Course description…" />
      <FileUpload
        label="Cover Image"
        accept="image/jpeg, image/png, image/webp"
        onFile={setCoverFile}
        progress={uploading ? progress : undefined}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Type"
          options={[{ value: 'free', label: 'Free' }, { value: 'premium', label: 'Premium' }]}
          {...register('type')}
        />
        {courseType === 'premium' && (
          <Input label="Price (₹)" type="number" {...register('price')} placeholder="499" />
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Category" {...register('category')} placeholder="Mathematics" />
        <Input label="Instructor" {...register('instructor')} placeholder="Instructor name" />
      </div>
      <Input label="Tags (comma separated)" {...register('tags')} placeholder="maths, science, jee" />
      <Toggle checked={published} onChange={setPublished} label="Published" />
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={isSubmitting || uploading}>
          {course ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const { docs: courses, loading, add, update, remove } = useCourses({ orderByField: 'createdAt' })
  const [filter, setFilter]     = useState('All')
  const [formOpen, setFormOpen]  = useState(false)
  const [editCourse, setEditCourse] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = courses.filter(c => {
    if (filter === 'All')       return true
    if (filter === 'Free')      return c.type === 'free'
    if (filter === 'Premium')   return c.type === 'premium'
    if (filter === 'Published') return c.published
    if (filter === 'Draft')     return !c.published
    return true
  })

  async function handleSave(data) {
    if (editCourse) {
      await update(editCourse.id, data)
    } else {
      await add(data)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      if (deleteTarget.coverUrl) await deleteFile(deleteTarget.coverUrl).catch(() => {})
      await remove(deleteTarget.id)
      toast.success('Course deleted')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <>
      <PageHeader
        title="Courses"
        count={courses.length}
        action={
          <Button onClick={() => { setEditCourse(null); setFormOpen(true) }}>
            <Plus size={15} /> Add Course
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto scrollbar-hide pb-1">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-shrink-0">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                filter === tab ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Table — shown on sm+ screens */}
      <Card className="overflow-hidden p-0 hidden sm:block">
        {loading ? (
          <div className="p-5"><TableSkeleton rows={5} cols={7} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses found"
            description="Create your first course to get started"
            action={
              <Button onClick={() => { setEditCourse(null); setFormOpen(true) }}>
                <Plus size={14} /> Add Course
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    { label: 'Cover', cls: '' },
                    { label: 'Title', cls: '' },
                    { label: 'Type', cls: 'hidden sm:table-cell' },
                    { label: 'Enrolments', cls: 'hidden md:table-cell' },
                    { label: 'Rating', cls: 'hidden lg:table-cell' },
                    { label: 'Status', cls: 'hidden sm:table-cell' },
                    { label: 'Actions', cls: '' },
                  ].map(h => (
                    <th key={h.label} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${h.cls}`}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    onEdit={c => { setEditCourse(c); setFormOpen(true) }}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Mobile card list — shown on xs screens only */}
      <Card className="overflow-hidden p-0 sm:hidden">
        {loading ? (
          <div className="p-4"><TableSkeleton rows={4} cols={2} /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses found"
            description="Create your first course to get started"
            action={
              <Button onClick={() => { setEditCourse(null); setFormOpen(true) }}>
                <Plus size={14} /> Add Course
              </Button>
            }
          />
        ) : (
          <div>
            {filtered.map(c => (
              <CourseMobileCard
                key={c.id}
                course={c}
                onEdit={c => { setEditCourse(c); setFormOpen(true) }}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editCourse ? 'Edit Course' : 'Add Course'}
        size="lg"
      >
        <CourseForm
          course={editCourse}
          onClose={() => setFormOpen(false)}
          onSave={handleSave}
        />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Course"
        message={`Delete "${deleteTarget?.title}"? This will also remove associated storage files.`}
      />
    </>
  )
}
