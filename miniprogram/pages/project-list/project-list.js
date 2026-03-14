const api = require('../../utils/api.js');

Page({
  data: {
    list: [],
    loading: true,
    error: '',
  },
  onLoad() {
    this.load();
  },
  onPullDownRefresh() {
    this.load().then(() => wx.stopPullDownRefresh());
  },
  async load() {
    this.setData({ loading: true, error: '' });
    try {
      const list = await api.getProjects();
      this.setData({
        list: Array.isArray(list) ? list : [],
        loading: false,
      });
    } catch (e) {
      this.setData({
        loading: false,
        error: e.message || '加载失败',
      });
    }
  },
  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/project-detail/project-detail?id=' + id });
  },
});
