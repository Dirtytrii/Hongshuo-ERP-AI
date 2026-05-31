import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { apiService, setStoredAuth } from '../../services/apiService';

interface LoginProps {
  onSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      const { token, user } = await apiService.login(username.trim(), password);
      setStoredAuth(token, user);
      onSuccess();
    } catch (err) {
      setError((err as Error).message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 p-4">
      <div
        className="absolute inset-0 bg-cover bg-[position:28%_center] md:bg-center"
        style={{ backgroundImage: "url('/images/hongshuo-login-bg.jpg')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/10" aria-hidden="true" />
      <div className="relative flex min-h-[calc(100vh-2rem)] items-center justify-center">
        <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white/92 px-7 py-8 shadow-[0_24px_70px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl">
          <h1 className="mb-7 text-center text-2xl font-bold tracking-[0.04em] text-slate-800">宏硕建设 ERP</h1>
          <h2 className="mb-5 text-center text-base font-bold text-slate-700">登录</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white/75 py-2.5 pl-10 pr-4 text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/25"
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-600">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-white/75 py-2.5 pl-10 pr-4 text-slate-800 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/25"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 py-2.5 font-medium text-white shadow-lg shadow-blue-900/15 transition-colors hover:from-blue-700 hover:to-blue-600 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-slate-400">默认管理员：admin / 123456</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
