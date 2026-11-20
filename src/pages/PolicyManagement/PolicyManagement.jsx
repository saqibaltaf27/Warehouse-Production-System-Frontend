import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import {
  IconDownload,
  IconFileTypePdf,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import Button from '../../global-components/Button/Button';
import Table from '../../global-components/Table/Table';
import { axiosInstance } from '../../apis/axiosinstance';
import { API_ENDPOINTS } from '../../apis/endpoints';
import { usePermission } from '../../context/permissioncheck';
import '../ProductionOrders/SalesOrderModal.css';
import './PolicyManagement.css';

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const MAIN_MODULE = 'Policy Management';
const DEPARTMENTS = ['Quality', 'Production', 'Engineering', 'Administration'];
const emptyForm = { title: '', department: '', file: null };

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const displayFileName = (row) => {
  const path = row.FilePath || '';
  const fromPath = path.split('/').pop();
  if (fromPath && fromPath.includes('-')) {
    const cleaned = fromPath.replace(/^\d+-/, '');
    if (cleaned) return cleaned;
  }
  return fromPath || `${row.Title || 'policy'}`;
};

const PolicyManagement = () => {
  const { hasModulePermission, loadingPermissions } = usePermission();
  const fileInputRef = useRef(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form, setForm] = useState(emptyForm);

  const canUpload =
    !loadingPermissions && hasModulePermission(MAIN_MODULE, 'Upload Policy');
  const canDelete =
    !loadingPermissions && hasModulePermission(MAIN_MODULE, 'Delete Policy');

  const viewableDepartments = useMemo(() => {
    if (loadingPermissions) return [];
    return DEPARTMENTS.filter((dept) =>
      hasModulePermission(MAIN_MODULE, `View ${dept}`),
    );
  }, [hasModulePermission, loadingPermissions]);

  const visiblePolicies = useMemo(() => {
    if (!viewableDepartments.length) return [];
    const allowed = new Set(viewableDepartments.map((d) => d.toLowerCase()));
    return policies.filter((row) =>
      allowed.has(String(row.Department || '').trim().toLowerCase()),
    );
  }, [policies, viewableDepartments]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.POLICIES.LIST, {
        skipGlobalLoading: true,
      });
      if (res.data?.success) {
        setPolicies(res.data.data || []);
      } else {
        toast.error(res.data?.message || 'Failed to load policies');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const validateFile = (nextFile) => {
    if (!nextFile) return null;
    const name = String(nextFile.name || '').toLowerCase();
    const type = String(nextFile.type || '').toLowerCase();
    const allowed =
      type === 'application/pdf' ||
      type.startsWith('image/') ||
      name.endsWith('.pdf') ||
      /\.(png|jpe?g|gif|webp|bmp|svg|heic|tiff?)$/i.test(name);
    if (!allowed) {
      toast.error('Only PDF or image files are allowed');
      return null;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      toast.error(`Max file size is ${MAX_FILE_MB} MB`);
      return null;
    }
    return nextFile;
  };

  const onPickFile = (nextFile) => {
    const valid = validateFile(nextFile);
    if (!valid) {
      setForm((prev) => ({ ...prev, file: null }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setForm((prev) => ({ ...prev, file: valid }));
  };

  const openUploadModal = () => {
    setForm(emptyForm);
    setDragging(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setShowUpload(true);
  };

  const closeUploadModal = () => {
    if (saving) return;
    setShowUpload(false);
    setForm(emptyForm);
    setDragging(false);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.department.trim()) {
      toast.error('Department is required');
      return;
    }
    if (!form.file) {
      toast.error('Please choose a file');
      return;
    }

    const body = new FormData();
    body.append('title', form.title.trim());
    body.append('department', form.department.trim());
    body.append('file', form.file);

    setSaving(true);
    try {
      const res = await axiosInstance.post(API_ENDPOINTS.POLICIES.CREATE, body, {
        headers: { 'Content-Type': undefined },
      });
      if (res.data?.success) {
        toast.success(res.data.message || 'Policy uploaded');
        closeUploadModal();
        setCurrentPage(1);
        fetchPolicies();
      } else {
        toast.error(res.data?.message || 'Upload failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  const openFile = async (row) => {
    try {
      const res = await axiosInstance.get(API_ENDPOINTS.POLICIES.FILE_URL(row.Id), {
        skipGlobalLoading: true,
      });
      if (res.data?.success && res.data.data?.url) {
        window.open(res.data.data.url, '_blank', 'noopener,noreferrer');
      } else {
        toast.error(res.data?.message || 'Could not open file');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not open file');
    }
  };

  const deletePolicy = async (row) => {
    if (!window.confirm(`Delete policy "${row.Title}"?`)) return;
    try {
      const res = await axiosInstance.delete(API_ENDPOINTS.POLICIES.DELETE(row.Id));
      if (res.data?.success) {
        toast.success('Policy deleted');
        fetchPolicies();
      } else {
        toast.error(res.data?.message || 'Delete failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'Title',
        header: 'Title',
        render: (row) => <span className="policy-doc-name">{row.Title}</span>,
      },
      { key: 'Department', header: 'Department', width: '140px' },
      {
        key: 'FilePath',
        header: 'File',
        render: (row) => {
          const name = displayFileName(row);
          const isPdf = name.toLowerCase().endsWith('.pdf');
          return (
            <div className="policy-file-cell">
              {isPdf ? (
                <IconFileTypePdf size={18} className="policy-pdf-icon" />
              ) : (
                <IconPhoto size={18} className="policy-image-icon" />
              )}
              <span title={name}>{name}</span>
            </div>
          );
        },
      },
      {
        key: 'CreatedByName',
        header: 'Created By',
        width: '130px',
        render: (row) => row.CreatedByName || row.CreatedBy || '—',
      },
      {
        key: 'CreatedAt',
        header: 'Created At',
        width: '120px',
        render: (row) => formatDate(row.CreatedAt),
      },
      {
        key: 'actions',
        header: 'Actions',
        width: canDelete ? '110px' : '70px',
        render: (row) => (
          <div className="policy-actions">
            <button
              type="button"
              className="policy-action-btn policy-action-download"
              title="Open / Download"
              onClick={() => openFile(row)}
            >
              <IconDownload size={16} />
            </button>
            {canDelete && (
              <button
                type="button"
                className="policy-action-btn policy-action-delete"
                title="Delete"
                onClick={() => deletePolicy(row)}
              >
                <IconTrash size={16} />
              </button>
            )}
          </div>
        ),
      },
    ],
    [canDelete],
  );

  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visiblePolicies.slice(start, start + pageSize);
  }, [visiblePolicies, currentPage, pageSize]);

  return (
    <div className="policy-page layout-page-padding">
      {canUpload && (
        <div className="policy-header">
          <Button variant="primary" icon={<IconPlus size={16} />} onClick={openUploadModal}>
            Upload Policy
          </Button>
        </div>
      )}

      {!loadingPermissions && viewableDepartments.length === 0 ? (
        <div className="policy-no-access">
          <h2>No department access</h2>
          <p>You do not have permission to view SOP records. A department view such as View Quality, View Production, View Engineering, or View Administration is required.</p>
        </div>
      ) : (
      <div className="policy-table-wrap">
        <Table
          data={pagedRows}
          columns={columns}
          totalEntries={visiblePolicies.length}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          isLoading={loading || loadingPermissions}
          showActions={false}
          showPagination={true}
        />
      </div>
      )}

      {showUpload &&
        createPortal(
          <div className="so-modal-overlay" onMouseDown={closeUploadModal}>
            <div
              className="so-modal-content policy-upload-modal"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="so-modal-header">
                <h3>Upload Policy</h3>
                <button
                  type="button"
                  className="so-modal-close"
                  onClick={closeUploadModal}
                  disabled={saving}
                >
                  &times;
                </button>
              </div>

              <form className="so-modal-body policy-upload-body" onSubmit={handleUpload}>
                <div className="po-header-details policy-upload-grid">
                  <div className="po-detail-item">
                    <strong>Title:</strong>
                    <span>
                      <input
                        type="text"
                        className="policy-detail-input"
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Company Ethics Policy 2026"
                        disabled={saving}
                        required
                      />
                    </span>
                  </div>

                  <div className="po-detail-item">
                    <strong>Department:</strong>
                    <span>
                      <select
                        className="policy-detail-input policy-detail-select"
                        value={form.department}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, department: e.target.value }))
                        }
                        disabled={saving}
                        required
                      >
                        <option value="" disabled>
                          Select department
                        </option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </span>
                  </div>
                </div>

                <div
                  className={`policy-dropzone ${dragging ? 'is-dragging' : ''} ${form.file ? 'has-file' : ''}`}
                  title={form.file ? form.file.name : 'Upload file'}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    onPickFile(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <IconUpload size={28} stroke={1.5} />
                  {form.file ? (
                    <p className="policy-drop-title">{form.file.name}</p>
                  ) : (
                    <>
                      <p className="policy-drop-title">
                        Upload PDF, JPEG, PNG or any image
                      </p>
                      <p className="policy-drop-sub">Max upload size {MAX_FILE_MB} MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf,image/*,.png,.jpg,.jpeg,.gif,.webp,.bmp"
                    hidden
                    onChange={(e) => onPickFile(e.target.files?.[0])}
                  />
                </div>

                <div className="policy-upload-actions">
                  <Button type="button" variant="outline" onClick={closeUploadModal} disabled={saving}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<IconUpload size={16} />}
                    disabled={saving}
                    isLoading={saving}
                  >
                    Upload Policy
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default PolicyManagement;
