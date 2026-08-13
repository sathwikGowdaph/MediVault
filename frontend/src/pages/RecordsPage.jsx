import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  FileText, UploadCloud, Search, Filter, Download, Trash2, Edit3,
  Brain, CheckCircle2, RefreshCw, Eye, ChevronLeft, ChevronRight, FileCode
} from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

const CATEGORIES = [
  'All',
  'Prescription',
  'Lab Report',
  'X-Ray',
  'MRI Report',
  'CT Report',
  'Discharge Summary',
  'Insurance Document',
  'Medical Image',
  'Other'
];

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('newest');

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    category: 'Prescription',
    doctor: '',
    hospital: '',
    recordDate: ''
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Modals & Selected Items
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: '', doctor: '', hospital: '' });

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null);
  const [processingOcrId, setProcessingOcrId] = useState(null);

  const fetchRecords = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        sort
      });
      if (category !== 'All') params.append('category', category);
      if (debouncedSearch) params.append('search', debouncedSearch);

      const { data } = await api.get(`/api/records?${params.toString()}`);
      setRecords(data.records || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (error) {
      toast.error('Unable to load medical records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords(1);
  }, [debouncedSearch, category, sort]);

  // Authenticated File Download Handler
  const handleDownload = async (record) => {
    try {
      const response = await api.get(`/api/files/${record._id}`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: record.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', record.fileName || `${record.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  // Upload Form Submit
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to upload');

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(uploadForm).forEach(([key, val]) => {
      if (val) formData.append(key, val);
    });

    setUploading(true);
    try {
      await api.post('/api/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Medical document uploaded successfully!');
      setFile(null);
      setUploadForm({ title: '', description: '', category: 'Prescription', doctor: '', hospital: '', recordDate: '' });
      e.target.reset();
      fetchRecords(1);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Trigger AI OCR Analysis
  const handleTriggerOcr = async (recordId) => {
    setProcessingOcrId(recordId);
    try {
      const { data } = await api.post(`/api/ai/ocr/${recordId}`);
      toast.success('AI Document OCR and analysis completed!');
      setAiAnalysisResult(data.analysis);
      setAiModalOpen(true);
      fetchRecords(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'AI OCR failed');
    } finally {
      setProcessingOcrId(null);
    }
  };

  // Delete Record
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await api.delete(`/api/records/${id}`);
      toast.success('Record deleted');
      fetchRecords(pagination.page);
    } catch (error) {
      toast.error('Unable to delete record');
    }
  };

  // Edit Record Modal Submit
  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditForm({
      title: record.title || '',
      description: record.description || '',
      category: record.category || 'Other',
      doctor: record.doctor || '',
      hospital: record.hospital || ''
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/records/${editingRecord._id}`, editForm);
      toast.success('Record metadata updated');
      setEditModalOpen(false);
      fetchRecords(pagination.page);
    } catch (error) {
      toast.error('Failed to update record');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Box */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
          <UploadCloud className="text-brand-600" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upload Medical Document</h2>
            <p className="text-xs text-slate-500">Securely store prescriptions, lab reports, X-rays & insurance files (PDF, PNG, JPG - Max 10MB)</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Title</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              placeholder="e.g. Blood Test Results"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
            <select
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm bg-white"
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Doctor Name</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              placeholder="e.g. Dr. A. K. Gupta"
              value={uploadForm.doctor}
              onChange={(e) => setUploadForm({ ...uploadForm, doctor: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hospital / Clinic</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              placeholder="e.g. Apollo Hospital"
              value={uploadForm.hospital}
              onChange={(e) => setUploadForm({ ...uploadForm, hospital: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Document Date</label>
            <input
              type="date"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              value={uploadForm.recordDate}
              onChange={(e) => setUploadForm({ ...uploadForm, recordDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select File</label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description / Notes</label>
            <textarea
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm h-20"
              placeholder="Additional notes about this document..."
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Search & Filter Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-3 text-slate-400" size={18} />
            <input
              className="w-full rounded-2xl border border-slate-300 pl-11 pr-4 py-2.5 text-sm"
              placeholder="Search title, doctor, hospital..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center">
            {/* Category dropdown */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                className="rounded-2xl border border-slate-300 px-3 py-2 text-xs bg-white font-medium"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Sort Dropdown */}
            <select
              className="rounded-2xl border border-slate-300 px-3 py-2 text-xs bg-white font-medium"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Records Table / List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Medical Records ({pagination.total})</h2>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard lines={3} />
            <SkeletonCard lines={3} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No records found"
            description={search ? "No files matched your search parameters." : "Upload your first medical file using the form above."}
          />
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 hover:border-brand-200 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-brand-100 p-3 text-brand-700 shrink-0">
                      <FileText size={22} />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {record.title}
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {record.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Doctor: <span className="font-medium text-slate-700">{record.doctor || 'N/A'}</span> • Hospital: <span className="font-medium text-slate-700">{record.hospital || 'N/A'}</span>
                      </p>
                      {record.description && (
                        <p className="text-xs text-slate-600 mt-1 italic">{record.description}</p>
                      )}

                      {/* AI Status Badge */}
                      <div className="mt-2 flex items-center gap-2">
                        {record.aiStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <CheckCircle2 size={12} /> AI Processed
                          </span>
                        ) : record.aiStatus === 'processing' || processingOcrId === record._id ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full animate-pulse">
                            <RefreshCw size={12} className="animate-spin" /> AI Processing OCR...
                          </span>
                        ) : (
                          <button
                            onClick={() => handleTriggerOcr(record._id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-0.5 rounded-full transition-colors"
                          >
                            <Brain size={12} /> Run AI OCR & Summary
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => handleDownload(record)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                    >
                      <Download size={14} /> Download
                    </button>

                    <button
                      onClick={() => openEditModal(record)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      title="Edit metadata"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(record._id)}
                      className="rounded-full p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                      title="Delete document"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* AI Summary Display snippet if present */}
                {record.aiSummary && (
                  <div className="mt-3 rounded-xl bg-white border border-brand-100 p-3 text-xs text-slate-700">
                    <span className="font-bold text-brand-700 flex items-center gap-1 mb-1">
                      <Brain size={12} /> Extracted AI Summary:
                    </span>
                    {record.aiSummary}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination controls */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
            <div>Showing page {pagination.page} of {pagination.pages}</div>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchRecords(pagination.page - 1)}
                className="rounded-full border border-slate-300 p-2 disabled:opacity-30 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchRecords(pagination.page + 1)}
                className="rounded-full border border-slate-300 p-2 disabled:opacity-30 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Record Metadata Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Document Info">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Title</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Category</label>
            <select
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm bg-white"
              value={editForm.category}
              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
            >
              {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Doctor</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
                value={editForm.doctor}
                onChange={(e) => setEditForm({ ...editForm, doctor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Hospital</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
                value={editForm.hospital}
                onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Description</label>
            <textarea
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm h-20"
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-brand-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Analysis Result Modal */}
      <Modal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} title="AI OCR Document Analysis">
        {aiAnalysisResult ? (
          <div className="space-y-4 text-xs sm:text-sm">
            <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4">
              <h3 className="font-bold text-brand-900 mb-1 flex items-center gap-2">
                <Brain size={18} /> Summary
              </h3>
              <p className="text-slate-700">{aiAnalysisResult.summary}</p>
            </div>

            {aiAnalysisResult.medicines?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-800 mb-1">Detected Medicines</h4>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysisResult.medicines.map((m, i) => (
                    <span key={i} className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg text-xs font-medium">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {aiAnalysisResult.allergies?.length > 0 && (
              <div>
                <h4 className="font-bold text-red-700 mb-1">Detected Allergies</h4>
                <div className="flex flex-wrap gap-1.5">
                  {aiAnalysisResult.allergies.map((a, i) => (
                    <span key={i} className="bg-red-100 text-red-800 px-2.5 py-1 rounded-lg text-xs font-medium">{a}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => setAiModalOpen(false)}
                className="rounded-full bg-brand-500 px-6 py-2 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Close Analysis
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
