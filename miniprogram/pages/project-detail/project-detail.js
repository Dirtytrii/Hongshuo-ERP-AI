const api = require('../../utils/api.js');

Page({
  data: {
    project: null,
    loading: true,
    error: '',
  },
  onLoad(options) {
    const id = options.id;
    if (id) this.load(id);
    else this.setData({ loading: false, error: '缺少项目ID' });
  },
  async load(id) {
    this.setData({ loading: true, error: '' });
    try {
      const project = await api.getProject(id);
      this.setData({ project, loading: false });
      wx.setNavigationBarTitle({ title: project.name || '项目详情' });
    } catch (e) {
      this.setData({
        loading: false,
        error: e.message || '加载失败',
      });
    }
  },
});
