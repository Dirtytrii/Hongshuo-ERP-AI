import React, { useCallback, useEffect, useState } from 'react';
import { Smartphone, MessageSquare, RefreshCcw } from 'lucide-react';
import { apiService } from '../../services/apiService';
import type { ApprovalTodoItem, MobileOverview } from '../../types';
import EmptyState from '../../shared/ui/EmptyState';
import PageHeader from '../../shared/ui/PageHeader';
import SectionCard from '../../shared/ui/SectionCard';
import Toolbar from '../../shared/ui/Toolbar';

interface ConfigPayload {
  dingTalkEnabled?: string | boolean;
  dingTalkWebhookUrl?: string;
  mobileApiEnabled?: string | boolean;
  webBaseUrl?: string;
  notifySubmittedTemplate?: string;
  notifyResultTemplate?: string;
}

interface DingTalkStatusPayload {
  enabled?: boolean;
  webhookConfigured?: boolean;
}

interface MobileStatusPayload {
  enabled?: boolean;
}

const IntegrationCenter: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState({
    dingTalkEnabled: false,
    dingTalkWebhookUrl: '',
    mobileApiEnabled: true,
    webBaseUrl: 'http://localhost:3000',
    notifySubmittedTemplate: '%s #%s 已提交审批\n发起人：%s\n摘要：%s\n办理入口：%s',
    notifyResultTemplate: '%s #%s 审批%s\n审批人：%s\n查看详情：%s',
  });
  const [status, setStatus] = useState({
    webhookConfigured: false,
    dingTalkEnabled: false,
    mobileEnabled: true,
  });
  const [mobileOverview, setMobileOverview] = useState<MobileOverview | null>(null);
  const [mobileTodos, setMobileTodos] = useState<ApprovalTodoItem[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [cfg, ding, mobileStatus, overview, todos] = await Promise.all([
        apiService.getConfig(),
        apiService.getDingTalkStatus(),
        apiService.getMobileIntegrationStatus(),
        apiService.getMobileOverview().catch(() => null),
        apiService.getMobileTodos().catch(() => []),
      ]);
      const cfgPayload = (cfg || {}) as ConfigPayload;
      const dingPayload = (ding || {}) as DingTalkStatusPayload;
      const mobilePayload = (mobileStatus || {}) as MobileStatusPayload;
      setConfig({
        dingTalkEnabled: String(cfgPayload.dingTalkEnabled) === 'true',
        dingTalkWebhookUrl: String(cfgPayload.dingTalkWebhookUrl || ''),
        mobileApiEnabled: String(cfgPayload.mobileApiEnabled) !== 'false',
        webBaseUrl: String(cfgPayload.webBaseUrl || 'http://localhost:3000'),
        notifySubmittedTemplate: String(
          cfgPayload.notifySubmittedTemplate || '%s #%s 已提交审批\n发起人：%s\n摘要：%s\n办理入口：%s'
        ),
        notifyResultTemplate: String(cfgPayload.notifyResultTemplate || '%s #%s 审批%s\n审批人：%s\n查看详情：%s'),
      });
      setStatus({
        webhookConfigured: Boolean(dingPayload.webhookConfigured),
        dingTalkEnabled: Boolean(dingPayload.enabled),
        mobileEnabled: Boolean(mobilePayload.enabled),
      });
      setMobileOverview((overview || null) as MobileOverview | null);
      setMobileTodos(Array.isArray(todos) ? (todos as ApprovalTodoItem[]) : []);
      setError(null);
    } catch (e: unknown) {
      setError((e as Error).message || '加载集成信息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveConfig = async () => {
    try {
      setSaving(true);
      await apiService.saveConfig({
        dingTalkEnabled: config.dingTalkEnabled,
        dingTalkWebhookUrl: config.dingTalkWebhookUrl.trim(),
        mobileApiEnabled: config.mobileApiEnabled,
        webBaseUrl: config.webBaseUrl.trim(),
        notifySubmittedTemplate: config.notifySubmittedTemplate,
        notifyResultTemplate: config.notifyResultTemplate,
      });
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async () => {
    try {
      await apiService.sendDingTalkTest('来自宏硕ERP集成中心的测试消息');
      await load();
    } catch (e: unknown) {
      setError((e as Error).message || '测试发送失败');
    }
  };

  if (loading) {
    return <EmptyState title="加载中..." description="正在读取集成中心配置和移动端状态。" compact />;
  }

  return (
    <div className="page-shell">
      <PageHeader
        title="集成中心"
        description="统一管理钉钉通知、移动端接口和回跳配置。页面样式与审批中心保持一致。"
        icon={<MessageSquare size={20} />}
        actions={
          <Toolbar>
            <button
              type="button"
              onClick={load}
              className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm flex items-center gap-1 hover:bg-slate-50"
            >
              <RefreshCcw size={14} /> 刷新
            </button>
          </Toolbar>
        }
      />
      <SectionCard
        title="钉钉机器人集成"
        description="配置审批通知 Webhook、消息模板和 Web 回跳地址。"
        icon={<MessageSquare size={18} />}
      >
          {error && <p className="text-sm text-red-600">{error}</p>}
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={config.dingTalkEnabled}
              onChange={(e) => setConfig((c) => ({ ...c, dingTalkEnabled: e.target.checked }))}
            />
            启用钉钉审批通知
          </label>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Webhook URL</label>
            <input
              value={config.dingTalkWebhookUrl}
              onChange={(e) => setConfig((c) => ({ ...c, dingTalkWebhookUrl: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2"
              placeholder="https://oapi.dingtalk.com/robot/send?access_token=..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Web 回跳地址</label>
            <input
              value={config.webBaseUrl}
              onChange={(e) => setConfig((c) => ({ ...c, webBaseUrl: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2"
              placeholder="http://localhost:3000"
            />
            <p className="text-xs text-slate-400 mt-1">用于钉钉消息中的“办理入口”链接（会自动拼接 tab 参数）。</p>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              提交通知模板（占位符：%s, %s, %s, %s, %s）
            </label>
            <textarea
              rows={3}
              value={config.notifySubmittedTemplate}
              onChange={(e) => setConfig((c) => ({ ...c, notifySubmittedTemplate: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              结果通知模板（占位符：%s, %s, %s, %s, %s）
            </label>
            <textarea
              rows={3}
              value={config.notifyResultTemplate}
              onChange={(e) => setConfig((c) => ({ ...c, notifyResultTemplate: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2"
            />
          </div>
          <div className="text-xs text-slate-500">
            当前状态：{status.dingTalkEnabled ? '已启用' : '未启用'} / Webhook{' '}
            {status.webhookConfigured ? '已配置' : '未配置'}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveConfig}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存配置'}
            </button>
            <button type="button" onClick={sendTest} className="px-4 py-2 border border-slate-200 rounded-xl font-bold">
              发送测试消息
            </button>
          </div>
      </SectionCard>

      <SectionCard
        title="轻量移动端接口"
        description="控制移动端概览与待办接口开关，并查看当前聚合结果。"
        icon={<Smartphone size={18} />}
      >
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={config.mobileApiEnabled}
              onChange={(e) => setConfig((c) => ({ ...c, mobileApiEnabled: e.target.checked }))}
            />
            启用移动端接口（/api/mobile/*）
          </label>
          <div className="text-xs text-slate-500">当前状态：{status.mobileEnabled ? '已启用' : '未启用'}</div>
          {mobileOverview && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">待审批：{mobileOverview.pendingApprovalCount}</div>
              <div className="p-3 bg-slate-50 rounded-xl">
                逾期待收：￥{Number(mobileOverview.overdueReceivableAmount).toLocaleString()}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">超预算项目：{mobileOverview.overBudgetProjectCount}</div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 px-3">类型</th>
                  <th className="py-2 px-3">标题</th>
                  <th className="py-2 px-3">申请人</th>
                  <th className="py-2 px-3 text-right">金额</th>
                  <th className="py-2 px-3">日期</th>
                </tr>
              </thead>
              <tbody>
                {mobileTodos.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <EmptyState title="暂无待办" description="移动端待办为空时，这里不会展示审批记录。" compact />
                    </td>
                  </tr>
                ) : (
                  mobileTodos.slice(0, 10).map((row) => (
                    <tr key={`${row.bizType}-${row.bizId}`} className="border-b border-slate-100">
                      <td className="py-2 px-3">{row.bizType}</td>
                      <td className="py-2 px-3">{row.title}</td>
                      <td className="py-2 px-3">{row.applicant}</td>
                      <td className="py-2 px-3 text-right">￥{Number(row.amount).toLocaleString()}</td>
                      <td className="py-2 px-3">{row.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </SectionCard>
    </div>
  );
};

export default IntegrationCenter;
