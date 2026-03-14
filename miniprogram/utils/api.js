const { request } = require('./request.js');

module.exports = {
  login(username, password) {
    return request({
      url: '/api/auth/login',
      method: 'POST',
      data: { username, password },
    });
  },
  getMe() {
    return request({ url: '/api/auth/me' });
  },
  getUpcomingPayments(days) {
    return request({ url: '/api/payment-plans/upcoming?days=' + (days || 15) });
  },
  getOverdueMilestones() {
    return request({ url: '/api/milestones/overdue' });
  },
  getProjects() {
    return request({ url: '/api/projects' });
  },
  getProject(id) {
    return request({ url: '/api/projects/' + id });
  },
};
