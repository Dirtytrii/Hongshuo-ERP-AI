import React, { useMemo, useState } from 'react';
import { Shield, Plus, Trash2, Settings, Search } from 'lucide-react';
import type { RoleDefinition } from '../../types';
import { apiService } from '../../services/apiService';

interface RoleManagementProps {
  roles: RoleDefinition[];
  onReload: () => Promise<void> | void;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ roles, onReload }) => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<RoleDefinition | null>(null);
  const [form, setForm] = useState<{ code: string; name: string; description: string }>({
    code: '',
    name: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    if (!kw) return roles;
    return roles.filter(
      (r) =>
        r.code.toLowerCase().includes(kw) ||
        (r.name && r.name.toLowerCase().includes(kw)) ||
        (r.description && r.description.toLowerCase().includes(kw))
    );
  }, [roles, search]);

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', name: '', description: '' });
    setError(null);
  };

  const openEdit = (role: RoleDefinition) => {
    setEditing(role);
    setForm({ code: role.code, name: role.name, description: role.description || '' });
    setError(null);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      setError('角色编码和名称不能为空');
      return;
    }
    try {
      setIsSaving(true);
      setError(null);
      if (editing) {
        await apiService.updateRole(editing.id, {
          // 内置角色不允许修改 code，由后端控制，这里仍然传入以便非内置时更新
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
        });
      } else {
        await apiService.createRole({
          code: form.code.trim(),
          name: form.name.trim(),
          description: form.description.trim(),
        });
      }
      await onReload();
      setEditing(null);
      setForm({ code: '', name: '', description: '' });
    } catch (e: any) {
      setError(e?.message || '保存角色失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (role: RoleDefinition) => {
    if (role.builtIn) {
      setError('内置角色不允许删除');
      return;
    }
    if (role.userCount && role.userCount > 0) {
      setError('仍有用户使用该角色，无法删除');
      return;
    }
    if (!confirm(`确定要删除角色「${role.name || role.code}」吗？此操作不可恢复。`)) return;
    try {
      setIsSaving(true);
      setError(null);
      await apiService.deleteRole(role.id);
      await onReload();
    } catch (e: any) {
      setError(e?.message || '删除角色失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <Shield size={18} /> 角色管理
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索角色编码/名称..."
                className="pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={openNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} /> 新建角色
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">编码</th>
                <th className="px-6 py-4 font-bold">名称</th>
                <th className="px-6 py-4 font-bold">描述</th>
                <th className="px-6 py-4 font-bold">内置</th>
                <th className="px-6 py-4 font-bold">绑定用户数</th>
                <th className="px-6 py-4 font-bold w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    暂无角色
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-700">{r.code}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{r.name}</td>
                    <td className="px-6 py-4 text-slate-600">{r.description || '-'}</td>
                    <td className="px-6 py-4">
                      {r.builtIn ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                          内置
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">
                          自定义
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{r.userCount ?? '-'}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="编辑"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        title="删除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(editing || form.code || form.name || form.description) && (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 space-y-4">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Settings size={18} /> {editing ? '编辑角色' : '新建角色'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">角色编码</label>
              <input
                type="text"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={editing?.builtIn}
                placeholder="如：site_supervisor"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">角色名称</label>
              <input
                type="text"
                className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：现场主管"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">角色描述</label>
            <textarea
              className="w-full bg-slate-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="可选，用于说明该角色的职责范围"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setForm({ code: '', name: '', description: '' });
                setError(null);
              }}
              className="px-4 py-2 rounded-xl border text-sm font-bold text-slate-600 hover:bg-slate-50"
              disabled={isSaving}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60"
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;
