const api = require('../../utils/api.js');

Page({
  data: {
    upcoming: [],
    overdue: [],
    projects: [],
    loading: true,
    error: '',
  },
  onLoad() {
    this.loadData();
  },
  onShow() {
    if (this.data.loading === false) {
      this.loadData();
    }
  },
  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },
  async loadData() {
    this.setData({ loading: true, error: '' });
    try {
      const [upcoming, overdue, projects] = await Promise.all([
        api.getUpcomingPayments(15).catch(() => []),
        api.getOverdueMilestones().catch(() => []),
        api.getProjects().catch(() => []),
      ]);
      const budgetAlerts = (projects || []).filter(
        (p) => p.budgetAlertStatus === 'yellow' || p.budgetAlertStatus === 'red'
      );
      this.setData({
        upcoming: Array.isArray(upcoming) ? upcoming : [],
        overdue: Array.isArray(overdue) ? overdue : [],
        projects: Array.isArray(projects) ? projects : [],
        budgetAlerts,
        loading: false,
      });
    } catch (e) {
      this.setData({
        loading: false,
        error: e.message || '加载失败',
      });
    }
  },
  goProjects() {
    wx.navigateTo({ url: '/pages/project-list/project-list' });
  },
  logout() {
    wx.removeStorageSync('erp_token');
    wx.removeStorageSync('erp_user');
    wx.reLaunch({ url: '/pages/login/login' });
  },
});
