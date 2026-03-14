const { BASE_URL } = require('./config.js');

function getToken() {
  return wx.getStorageSync('erp_token') || '';
}

function request(options) {
  const token = getToken();
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...options.header,
      },
      success(res) {
        if (res.statusCode === 401) {
          wx.removeStorageSync('erp_token');
          wx.removeStorageSync('erp_user');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error('登录已过期'));
          return;
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const err = (res.data && res.data.error) || res.errMsg || '请求失败';
          reject(new Error(err));
        }
      },
      fail(err) {
        reject(err);
      },
    });
  });
}

module.exports = {
  getToken,
  request,
};
