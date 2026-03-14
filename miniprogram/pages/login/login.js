const api = require('../../utils/api.js');

Page({
  data: {
    username: '',
    password: '',
    loading: false,
    error: '',
  },
  onUsernameInput(e) {
    this.setData({ username: e.detail.value, error: '' });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value, error: '' });
  },
  async doLogin() {
    const { username, password } = this.data;
    if (!username.trim()) {
      this.setData({ error: '请输入用户名' });
      return;
    }
    if (!password) {
      this.setData({ error: '请输入密码' });
      return;
    }
    this.setData({ loading: true, error: '' });
    try {
      const res = await api.login(username.trim(), password);
      wx.setStorageSync('erp_token', res.token);
      wx.setStorageSync('erp_user', res.user);
      wx.reLaunch({ url: '/pages/index/index' });
    } catch (err) {
      this.setData({
        loading: false,
        error: err.message || '登录失败，请检查用户名和密码',
      });
    }
  },
});
