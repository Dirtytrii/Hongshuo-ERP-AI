import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { apiService, setStoredAuth } from '../../services/apiService';
import { SHOW_DEMO_CONTROLS } from '../../app/config/demoControls';

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
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#58534c] p-4">
      <img
        src="/images/hongshuo-login-bg-extended.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[42%_center] md:object-center"
        aria-hidden="true"
        draggable={false}
      />
      <div className="absolute inset-0 bg-white/10" aria-hidden="true" />
      <div
        className="pointer-events-none absolute left-5 top-5 z-[1] text-white sm:left-8 sm:top-6 lg:left-10 lg:top-10"
        aria-hidden="true"
      >
        <p className="text-sm font-semibold tracking-[0.24em] drop-shadow-[0_1px_10px_rgba(15,23,42,0.35)] sm:text-base">
          HONGSHUO ERP
        </p>
        <div className="mt-2 h-px w-8 bg-white/80" />
        <p className="mt-2 text-[10px] font-medium tracking-[0.18em] text-white/72 drop-shadow-[0_1px_8px_rgba(15,23,42,0.28)] sm:text-xs">
          PROJECT · MATERIAL · FINANCE
        </p>
      </div>
      <div
        className="pointer-events-none absolute bottom-8 left-8 z-[1] hidden max-w-[16rem] text-white/76 md:block lg:left-10"
        aria-hidden="true"
      >
        <p className="text-xs font-medium tracking-[0.12em]">CONSTRUCTION MANAGEMENT PLATFORM</p>
        <p className="mt-2 text-xs font-medium tracking-[0.12em]">REAL-TIME OPERATIONS</p>
        <div className="mt-3 h-px w-8 bg-white/70" />
      </div>
      <div className="relative z-10 flex min-h-[calc(100dvh-2rem)] items-center justify-center">
        <div
          data-login-panel="true"
          className="login-liquid-panel relative w-full max-w-sm translate-y-10 overflow-hidden rounded-[1.75rem] px-7 py-7 text-slate-800 md:translate-y-0 2xl:max-w-md 2xl:px-8 2xl:py-8"
        >
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute left-5 top-5 h-4 w-4 border-l border-t border-white/65"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-5 top-5 h-4 w-4 border-r border-t border-white/65"
            aria-hidden="true"
          />
          <div className="mb-6 border-b border-white/35 pb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/55 bg-white/42 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
              <img src="/images/hongshuo-logo.png" alt="" className="h-9 w-9 rounded-xl object-cover" />
            </div>
            <p className="mb-2 text-xs font-semibold text-slate-500/95">项目协同管理中台</p>
            <h1 className="text-2xl font-bold tracking-[0.05em] text-slate-900">宏硕建设 ERP</h1>
          </div>
          <h2 className="mb-5 flex items-center justify-center gap-3 text-base font-bold text-slate-800">
            <span className="h-px w-8 bg-white/55" aria-hidden="true" />
            登录
            <span className="h-px w-8 bg-white/55" aria-hidden="true" />
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">用户名</label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="login-liquid-field w-full rounded-2xl py-3 pl-10 pr-4 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-white/80 focus:bg-white/50 focus:ring-2 focus:ring-blue-500/35"
                  placeholder="请输入用户名"
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">密码</label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                  size={18}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-liquid-field w-full rounded-2xl py-3 pl-10 pr-4 text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-white/80 focus:bg-white/50 focus:ring-2 focus:ring-blue-500/35"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
            </div>
            {error && (
              <p className="rounded-2xl border border-red-200/70 bg-red-50/80 px-3 py-2 text-sm font-medium text-red-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl border border-white/35 bg-[#0f4c81] py-3 font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_34px_rgba(15,76,129,0.28)] transition hover:bg-[#0b3f6d] disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
          {SHOW_DEMO_CONTROLS && (
            <p className="login-liquid-note mt-5 rounded-full px-3 py-2 text-center text-xs font-medium text-slate-600">
              默认管理员：admin / 123456
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
