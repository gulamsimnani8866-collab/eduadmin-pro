// src/pages/CoursesPage.jsx — Professional Course Management Suite
import { useState, useMemo, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Edit2, Trash2, BookOpen, Search, LayoutGrid,
  List, Star, Users, CheckCircle2, IndianRupee, Eye, EyeOff,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useCourses, useUpload } from '../hooks/useFirestore'
import { storagePaths } from '../lib/storage'
import { isCloudinaryUrl } from '../lib/cloudinary'
import {
  PageHeader, Card, Button, Badge, SlideOver, ConfirmDialog,
  Input, Textarea, Toggle, TableSkeleton, EmptyState,
  Tabs
} from '../components/ui/index'

const CATEGORIES = [
  'All Categories',
  'Engineering Prep',
  'Medical Prep',
  'Board Prep',
  'Computer Science',
  'Secondary School',
  'Competitive Exams',
]

const COVER_PRESETS = [
  { name: 'Physics & Mechanics', url: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80' },
  { name: 'Mathematics & Calculus', url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chemistry Laboratory', url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80' },
  { name: 'Computer Science & Code', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80' },
  { name: 'Biology & Medical', url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&w=800&q=80' },
  { name: 'Competitive Exam Prep', url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80' },
]

const PRICE_PRESETS = [
  { label: 'Free (₹0)', type: 'free', price: 0 },
  { label: '₹499', type: 'premium', price: 499 },
  { label: '₹999', type: 'premium', price: 999 },
  { label: '₹1,999', type: 'premium', price: 1999 },
  { label: '₹2,999', type: 'premium', price: 2999 },
  { label: '₹4,999', type: 'premium', price: 4999 },
]

const courseSchema = z.object({
  title:        z.string().min(3, 'Title is required (minimum 3 characters)'),
  description:  z.string().optional(),
  type:         z.enum(['free', 'premium']),
  price:        z.coerce.number().min(0, 'Price must be 0 or greater').optional(),
  category:     z.string().min(1, 'Category is required'),
  instructor:   z.string().min(2, 'Instructor name is required'),
  tags:         z.string().optional(),
  published:    z.boolean().optional(),
  coverUrl:     z.string().optional(),
})

export default function CoursesPage() {
  const { docs: courses, loading, add, update, remove } = useCourses()
  const { upload, progress: uploadProgress, uploading } = useUpload()
  const fileInputRef = useRef(null)

  const [activeTab, setActiveTab] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'

  // Drawer & form states
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [coverTab, setCoverTab] = useState('upload') // 'upload' | 'preset' | 'url'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      type: 'premium',
      price: 2499,
      published: true,
      category: 'Engineering Prep',
      coverUrl: '',
      instructor: '',
      description: '',
      tags: '',
    },
  })

  const courseType = watch('type')
  const currentCoverUrl = watch('coverUrl')
  const currentCategory = watch('category')

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (activeTab === 'Published' && !c.published) return false
      if (activeTab === 'Drafts' && c.published) return false
      if (activeTab === 'Premium' && c.type !== 'premium') return false
      if (activeTab === 'Free' && c.type !== 'free') return false

      if (categoryFilter !== 'All Categories' && c.category !== categoryFilter) return false

      if (search.trim()) {
        const q = search.toLowerCase()
        const titleMatch = c.title?.toLowerCase().includes(q)
        const instructorMatch = c.instructor?.toLowerCase().includes(q)
        const categoryMatch = c.category?.toLowerCase().includes(q)
        const tagMatch = c.tags?.toLowerCase().includes(q)
        if (!titleMatch && !instructorMatch && !categoryMatch && !tagMatch) return false
      }

      return true
    })
  }, [courses, activeTab, categoryFilter, search])

  // Aggregate stats
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrollments || 0), 0)
  const publishedCount = courses.filter(c => c.published).length
  const premiumCount = courses.filter(c => c.type === 'premium').length

  function openCreateModal() {
    setEditingCourse(null)
    reset({
      title: '',
      description: '',
      type: 'premium',
      price: 2499,
      category: 'Engineering Prep',
      instructor: '',
      tags: '',
      published: true,
      coverUrl: '',
    })
    setDrawerOpen(true)
  }

  function openEditModal(course) {
    setEditingCourse(course)
    reset({
      title: course.title,
      description: course.description || '',
      type: course.type || 'premium',
      price: course.price ?? (course.type === 'premium' ? 2499 : 0),
      category: course.category || 'Engineering Prep',
      instructor: course.instructor || '',
      tags: course.tags || '',
      published: Boolean(course.published),
      coverUrl: course.coverUrl || '',
    })
    setDrawerOpen(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const path = storagePaths.courseCover(editingCourse?.id || `course_${Date.now()}`)
      const downloadUrl = await upload(file, path)
      setValue('coverUrl', downloadUrl)
      toast.success('Cover image uploaded to Cloudinary!')
    } catch (err) {
      toast.error('Upload failed: ' + err.message)
    }
  }

  async function handleFormSubmit(data, addAnother = false) {
    setSubmitting(true)
    try {
      if (editingCourse) {
        await update(editingCourse.id, data)
        setDrawerOpen(false)
      } else {
        await add({
          ...data,
          enrollments: 0,
          rating: 5.0,
          coverUrl: data.coverUrl || '',
        })
        if (addAnother) {
          toast.success('Course created! Ready for next course.')
          reset({
            title: '',
            description: '',
            type: data.type || 'premium',
            price: data.price || 0,
            category: data.category || 'Engineering Prep',
            instructor: data.instructor || '',
            tags: '',
            published: true,
            coverUrl: '',
          })
          if (fileInputRef.current) fileInputRef.current.value = ''
        } else {
          setDrawerOpen(false)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleTogglePublish(course) {
    await update(course.id, { published: !course.published })
    toast.success(course.published ? 'Moved to Drafts' : 'Course Published Live!')
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return
    await remove(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const tabsConfig = [
    { id: 'All',       label: 'All Courses', count: courses.length },
    { id: 'Published', label: 'Published',   count: publishedCount },
    { id: 'Drafts',    label: 'Drafts',      count: courses.length - publishedCount },
    { id: 'Premium',   label: 'Premium',     count: premiumCount },
    { id: 'Free',      label: 'Free',        count: courses.length - premiumCount },
  ]

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <PageHeader
        title="Course Management"
        description="Publish curricula, organize syllabus modules, and manage course enrollments"
        count={courses.length}
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={openCreateModal}
          >
            Create Course
          </Button>
        }
      />

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Active Curricula</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{courses.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60">
            <BookOpen size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Published Live</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{publishedCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Premium Tiers</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{premiumCount}</p>
          </div>
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/60">
            <IndianRupee size={18} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Students</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalStudents.toLocaleString()}</p>
          </div>
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60">
            <Users size={18} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Tabs
            tabs={tabsConfig}
            activeTab={activeTab}
            onChange={setActiveTab}
          />

          {/* View mode buttons */}
          <div className="flex items-center gap-2 self-end lg:self-auto">
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid Card View"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Compact Table View"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by course title, faculty, keywords or tags…"
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses Display */}
      {loading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : filteredCourses.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            icon={BookOpen}
            title="No courses match your filter"
            description="Try adjusting your search criteria or create a new course for your institution."
            action={
              <Button variant="primary" icon={Plus} onClick={openCreateModal}>
                Create New Course
              </Button>
            }
          />
        </Card>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map(course => (
            <Card
              key={course.id}
              className="flex flex-col justify-between overflow-hidden p-0 border-slate-200/80 hover:shadow-card-hover group"
            >
              {/* Cover Image & Badges */}
              <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                {course.coverUrl ? (
                  <img
                    src={course.coverUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-800 to-indigo-900 flex items-center justify-center">
                    <BookOpen size={36} className="text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <Badge
                    variant={course.published ? 'green' : 'amber'}
                    dot
                    size="xs"
                    className="backdrop-blur-md bg-white/90 font-bold"
                  >
                    {course.published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge
                    variant={course.type === 'premium' ? 'purple' : 'blue'}
                    size="xs"
                    className="backdrop-blur-md bg-white/90 font-bold"
                  >
                    {course.type === 'premium' ? `₹${course.price ?? 2499}` : 'Free'}
                  </Badge>
                </div>

                {/* Rating badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span>{course.rating || 4.8}</span>
                </div>

                {/* Enrollments */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-200 text-[11px] font-semibold">
                  <Users size={12} />
                  <span>{(course.enrollments || 0).toLocaleString()} students</span>
                </div>
              </div>

              {/* Course Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-accent-600 uppercase tracking-wider mb-1">
                    {course.category || 'Curriculum'}
                  </p>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Faculty: <span className="font-medium text-slate-700">{course.instructor || 'Lead Instructor'}</span>
                  </p>
                  {course.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(course)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition"
                  >
                    {course.published ? (
                      <>
                        <EyeOff size={13} />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Eye size={13} className="text-emerald-600" />
                        <span className="text-emerald-700">Publish Live</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(course)}
                      className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Course"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(course)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Course"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Compact Table View */
        <Card className="p-0 overflow-hidden border-slate-200/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Course Info</th>
                  <th className="py-3 px-4">Instructor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Access / Fee</th>
                  <th className="py-3 px-4 text-center">Students</th>
                  <th className="py-3 px-4 text-center">Rating</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredCourses.map(course => (
                  <tr key={course.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 rounded-lg bg-slate-900 overflow-hidden flex-shrink-0">
                          {course.coverUrl ? (
                            <img src={course.coverUrl} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/30">
                              <BookOpen size={14} />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{course.title}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{course.tags || 'General'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{course.instructor || 'Staff'}</td>
                    <td className="py-3 px-4 text-slate-600">{course.category || 'General'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={course.type === 'premium' ? 'purple' : 'green'} size="xs">
                        {course.type === 'premium' ? `₹${course.price ?? 2499}` : 'Free'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {(course.enrollments || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {course.rating || 4.8}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={course.published ? 'green' : 'amber'} dot size="xs">
                        {course.published ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(course)}
                          className="p-1.5 text-slate-400 hover:text-accent-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(course)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
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
        </Card>
      )}

      {/* Fast & Efficient High-Productivity SlideOver Drawer */}
      <SlideOver
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingCourse ? 'Edit Course Curricula' : 'Create New Course'}
        subtitle="Configure academic curricula, pricing tiers, cover media, and publishing status."
        width="sm:max-w-2xl"
      >
        <form
          onSubmit={handleSubmit(data => handleFormSubmit(data, false))}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit(data => handleFormSubmit(data, false))()
            }
          }}
          className="space-y-6"
        >
          {/* SECTION 1: Academic & Faculty Details */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-accent-100 text-accent-700 text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Academic & Faculty Details
              </h3>
            </div>

            <Input
              label="Course Title *"
              placeholder="e.g. Advanced JEE Mathematics 2026: Calculus Mastery"
              error={errors.title?.message}
              {...register('title')}
            />

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Academic Category *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setValue('category', cat)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition ${
                      currentCategory === cat
                        ? 'bg-accent-50 text-accent-700 border-accent-300 font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('category')} />
            </div>

            <Input
              label="Lead Instructor / Faculty Name *"
              placeholder="e.g. Er. Anand Kumar (Ex-IIT Kanpur)"
              error={errors.instructor?.message}
              {...register('instructor')}
            />

            <Textarea
              label="Overview & Curriculum Summary"
              placeholder="Describe what students will learn, prerequisites, chapter breakdown, and target outcomes..."
              rows={3}
              error={errors.description?.message}
              {...register('description')}
            />
          </div>

          {/* SECTION 2: Access Tier & Pricing */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Enrollment Tier & Pricing
              </h3>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Quick Fee Presets:</span>
                <span className="text-[11px] text-slate-400">Select or enter custom price</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {PRICE_PRESETS.map(preset => {
                  const isSelected = courseType === preset.type && Number(watch('price')) === preset.price
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setValue('type', preset.type)
                        setValue('price', preset.price)
                      }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
                        isSelected
                          ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              {courseType === 'premium' && (
                <div className="pt-2">
                  <Input
                    label="Custom Course Enrollment Fee (₹ INR) *"
                    type="number"
                    placeholder="2499"
                    error={errors.price?.message}
                    {...register('price')}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Visual Media & Cover Image */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Course Visual Cover Banner
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold bg-slate-100 p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setCoverTab('upload')}
                  className={`px-2 py-0.5 rounded-md transition ${coverTab === 'upload' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setCoverTab('preset')}
                  className={`px-2 py-0.5 rounded-md transition ${coverTab === 'preset' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  Curated Presets
                </button>
                <button
                  type="button"
                  onClick={() => setCoverTab('url')}
                  className={`px-2 py-0.5 rounded-md transition ${coverTab === 'url' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                >
                  Paste URL
                </button>
              </div>
            </div>

            {/* Live Cover Preview if exists */}
            {currentCoverUrl && (
              <div className="relative h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                <img src={currentCoverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                {isCloudinaryUrl(currentCoverUrl) && (
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/90 text-white shadow">
                    <CheckCircle2 size={10} /> Cloudinary URL
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <span className="text-xs font-bold text-white bg-black/60 px-2 py-1 rounded">Active Cover</span>
                  <button
                    type="button"
                    onClick={() => setValue('coverUrl', '')}
                    className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
                    title="Remove Cover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab: Direct Upload to Cloudinary */}
            {coverTab === 'upload' && (
              <div className="border-2 border-dashed border-slate-200 hover:border-accent-400 rounded-xl p-5 text-center transition bg-slate-50/50">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="course-cover-upload"
                />
                <label htmlFor="course-cover-upload" className="cursor-pointer block space-y-2">
                  <div className="w-10 h-10 rounded-full bg-accent-50 text-accent-600 flex items-center justify-center mx-auto">
                    <Upload size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-accent-700 hover:underline">
                      Click to upload banner to Cloudinary
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, or WebP up to 10MB</p>
                  </div>
                </label>
                {uploading && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-accent-600 h-1.5 transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Uploading to Cloudinary: {uploadProgress}%</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: 1-Click Curated Presets */}
            {coverTab === 'preset' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COVER_PRESETS.map(preset => {
                  const isSelected = currentCoverUrl === preset.url
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setValue('coverUrl', preset.url)}
                      className={`group relative h-16 rounded-lg overflow-hidden border-2 text-left transition ${
                        isSelected
                          ? 'border-accent-600 ring-2 ring-accent-400/30'
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-1.5">
                        <span className="text-[10px] font-semibold text-white truncate leading-none">
                          {preset.name}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Tab: Direct URL */}
            {coverTab === 'url' && (
              <Input
                label="Direct Image Link (CDN or Unsplash)"
                placeholder="https://images.unsplash.com/..."
                helperText="Paste any direct public image URL"
                error={errors.coverUrl?.message}
                {...register('coverUrl')}
              />
            )}
          </div>

          {/* SECTION 4: Tags & Publishing */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                4
              </span>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Discovery Tags & Portal Status
              </h3>
            </div>

            <Input
              label="Keywords & Search Tags (Comma separated)"
              placeholder="JEE Main 2026, Calculus, Class 12, Mock Test"
              error={errors.tags?.message}
              {...register('tags')}
            />

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Toggle
                checked={watch('published')}
                onChange={v => setValue('published', v)}
                label="Publish immediately to student portal"
                description="When enabled, enrolled students will immediately see this course on their dashboard."
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
                type="button"
                variant="secondary"
                onClick={() => setDrawerOpen(false)}
              >
                Cancel
              </Button>

              {!editingCourse && (
                <Button
                  type="button"
                  variant="secondary"
                  loading={submitting}
                  onClick={handleSubmit(data => handleFormSubmit(data, true))}
                  className="text-accent-700 hover:text-accent-800 border-accent-200 hover:bg-accent-50"
                >
                  Save & Add Another
                </Button>
              )}

              <Button
                type="button"
                variant="primary"
                loading={submitting || uploading}
                onClick={handleSubmit(data => handleFormSubmit(data, false))}
              >
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </Button>
            </div>
          </div>
        </form>
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Course"
        message={`Are you sure you want to permanently delete "${deleteConfirm?.title}"? All associated lesson enrollments will be archived.`}
      />
    </div>
  )
}
