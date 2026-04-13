import React from 'react';
import { Plus, Settings, Trash2, User } from 'lucide-react';

interface AuthUserRow {
  id: number;
  username: string;
  role: string;
  enabled: boolean;
}

interface UserManagementPageProps {
  users: AuthUserRow[];
  search: string;
  getRoleLabel: (role: string) => string;
  onSearchChange: (value: string) => void;
  onCreateUser: () => void;
  onEditUser: (user: AuthUserRow) => void;
  onDeleteUser: (user: AuthUserRow) => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({
  users,
  search,
  getRoleLabel,
  onSearchChange,
  onCreateUser,
  onEditUser,
  onDeleteUser,
}) => {
  const keyword = search.trim().toLowerCase();
  const filtered = !keyword
    ? users
    : users.filter((user) => {
        const roleLabel = getRoleLabel(user.role);
        return user.username.toLowerCase().includes(keyword) || roleLabel.toLowerCase().includes(keyword);
      });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm overflow-hidden">
        <div className="p-6 border-b flex flex-wrap justify-between items-center gap-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-700">
            <User size={18} /> 用户管理
          </h3>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索用户名或角色..."
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={onCreateUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={16} /> 新建用户
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b text-slate-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">用户名</th>
                <th className="px-6 py-4 font-bold">角色</th>
                <th className="px-6 py-4 font-bold">状态</th>
                <th className="px-6 py-4 font-bold w-32">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    暂无用户
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-700">{user.username}</td>
                    <td className="px-6 py-4 text-slate-600">{getRoleLabel(user.role)}</td>
                    <td className="px-6 py-4">
                      <span className={user.enabled ? 'text-green-600' : 'text-slate-400'}>
                        {user.enabled ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditUser(user)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="编辑"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user)}
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
    </div>
  );
};

export default UserManagementPage;
