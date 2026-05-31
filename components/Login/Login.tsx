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
        <div className="relative w-full max-w-sm overflow-hidden rounded-[1.75rem] border border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(244,247,250,0.9))] px-7 py-7 shadow-[0_26px_80px_rgba(15,23,42,0.24),inset_0_1px_0_rgba(255,255,255,0.92)] backdrop-blur-xl">
          <div
            className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l border-t border-slate-300/70"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r border-t border-slate-300/70"
            aria-hidden="true"
          />
          <div className="mb-6 border-b border-slate-200/70 pb-5 text-center">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-slate-400">ACCESS PANEL</p>
            <h1 className="text-2xl font-bold tracking-[0.05em] text-slate-800">宏硕建设 ERP</h1>
          </div>
          <h2 className="mb-5 flex items-center justify-center gap-3 text-base font-bold text-slate-700">
            <span className="h-px w-8 bg-slate-300/80" aria-hidden="true" />
            登录
            <span className="h-px w-8 bg-slate-300/80" aria-hidden="true" />
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 pl-10 pr-4 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-600">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200/90 bg-slate-50/80 py-3 pl-10 pr-4 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition-colors placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 py-3 font-semibold tracking-wide text-white shadow-[0_14px_30px_rgba(37,99,235,0.24)] transition-colors hover:from-blue-800 hover:via-blue-700 hover:to-blue-600 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          <p className="mt-5 rounded-full border border-slate-200/70 bg-white/50 px-3 py-2 text-center text-xs text-slate-500">
            默认管理员：admin / 123456
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
