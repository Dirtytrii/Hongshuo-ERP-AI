/**
 * API Service to communicate with Java Spring Boot Backend
 */
const BASE_URL = '/api';

export const apiService = {
  // Projects
  async getProjects() {
    const res = await fetch(`${BASE_URL}/projects`);
    return res.json();
  },
  
  // Inventory
  async getInventory() {
    const res = await fetch(`${BASE_URL}/inventory`);
    return res.json();
  },

  // Finance
  async postTransaction(data: any) {
    const res = await fetch(`${BASE_URL}/finance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Stock operations
  async updateStock(data: any) {
    const res = await fetch(`${BASE_URL}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};
