import React, { useState, useEffect } from 'react';
import { FileText, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { apiService } from '../../services/apiService';

export interface ProjectDocumentType {
  id: number;
  projectId: number;
  name: string;
  link?: string;
  remark?: string;
}

interface ProjectDocumentListProps {
  projectId: number;
}

const ProjectDocumentList: React.FC<ProjectDocumentListProps> = ({ projectId }) => {
  const [docs, setDocs] = useState<ProjectDocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ProjectDocumentType | null>(null);
  const [form, setForm] = useState({ name: '', link: '', remark: '' });
  const [saving, setSaving] = useState(false);

  const loadDocs = async () => {
    try {
      const list = await apiService.getProjectDocuments(projectId);
      setDocs(Array.isArray(list) ? list : []);
    } catch {
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [projectId]);

  const openAdd = () => {
    setEditingDoc(null);
    setForm({ name: '', link: '', remark: '' });
    setIsModalOpen(true);
  };

  const openEdit = (doc: ProjectDocumentType) => {
    setEditingDoc(doc);
    setForm({
      name: doc.name || '',
      link: doc.link || '',
      remark: doc.remark || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editingDoc) {
        await apiService.updateProjectDocument(editingDoc.id, {
          name: form.name.trim(),
          link: form.link.trim() || undefined,
          remark: form.remark.trim() || undefined,
        });
      } else {
        await apiService.createProjectDocument(projectId, {
          name: form.name.trim(),
          link: form.link.trim() || undefined,
          remark: form.remark.trim() || undefined,
        });
      }
      await loadDocs();
      closeModal();
    } catch (err: unknown) {
      alert((err as Error)?.message || '操作失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (doc: ProjectDocumentType) => {
    if (!confirm(`确定删除文档「${doc.name}」吗？`)) return;
    try {
      await apiService.deleteProjectDocument(doc.id);
      await loadDocs();
    } catch (err: unknown) {
      alert((err as Error)?.message || '删除失败');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <FileText size={18} className="text-slate-600" />
            项目文档清单
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            记录文档名称与链接（实际文件可存钉钉/企微等），便于在系统内查阅清单。
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} /> 新增文档
        </button>
      </div>
      {loading ? (
        <div className="text-center text-slate-400 py-8">加载中...</div>
      ) : docs.length === 0 ? (
        <div className="text-center text-slate-400 py-8">暂无文档记录</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 text-left">
                <th className="py-2 px-3">名称</th>
                <th className="py-2 px-3">链接</th>
                <th className="py-2 px-3">备注</th>
                <th className="py-2 px-3 w-24">操作</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => (
                <tr key={doc.id} className="border-b border-slate-100">
                  <td className="py-2 px-3 font-medium text-slate-700">{doc.name}</td>
                  <td className="py-2 px-3">
                    {doc.link ? (
                      <a
                        href={doc.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink size={14} /> 打开
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-slate-600 max-w-xs truncate" title={doc.remark || ''}>
                    {doc.remark || '—'}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(doc)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="编辑"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeModal}>
          <div
            className="bg-white rounded-3xl shadow-xl border border-slate-100/80 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-slate-700 mb-4">{editingDoc ? '编辑文档' : '新增文档'}</h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="如：施工图、合同扫描件"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">链接（可选）</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">备注（可选）</label>
                <textarea
                  value={form.remark}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  rows={2}
                  placeholder="说明或存放位置"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDocumentList;
