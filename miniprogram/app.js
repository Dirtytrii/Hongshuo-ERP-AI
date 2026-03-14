App({
  onLaunch() {
    const token = wx.getStorageSync('erp_token');
    if (token) {
      wx.reLaunch({ url: '/pages/index/index' });
    } else {
      wx.reLaunch({ url: '/pages/login/login' });
    }
  },
  globalData: {
    baseUrl: 'https://your-api-domain.com',
    token: '',
  },
});
