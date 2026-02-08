import RequestHandler from './RequestHandler';

const baseUrl = '/general';

const bookInventoryAPI = {
  // Books CRUD
  async get_all_books() {
    const response = await RequestHandler.get(`${baseUrl}/books`);
    return response.data;
  },

  async get_book_by_id(id) {
    const response = await RequestHandler.get(`${baseUrl}/books/${id}`);
    return response.data;
  },

  async create_book(payload) {
    const response = await RequestHandler.post(`${baseUrl}/books`, payload);
    return response.data;
  },

  async update_book(id, payload) {
    const response = await RequestHandler.put(`${baseUrl}/books/${id}`, payload);
    return response.data;
  },

  async delete_book(id) {
    const response = await RequestHandler.del(`${baseUrl}/books/${id}`);
    return response.data;
  },

  // Restock (connected to finance as expense)
  async restock_book(id, payload) {
    const response = await RequestHandler.post(
      `${baseUrl}/books/${id}/restock`,
      payload
    );
    return response.data;
  },

  // Sell (connected to finance as income)
  async sell_book(id, payload) {
    const response = await RequestHandler.post(
      `${baseUrl}/books/${id}/sell`,
      payload
    );
    return response.data;
  },

  // Transactions
  async get_book_transactions(filters = {}) {
    const params = new URLSearchParams();
    if (filters.book_id) params.set('book_id', String(filters.book_id));
    if (filters.type) params.set('type', filters.type);
    const query = params.toString();
    const url = query
      ? `${baseUrl}/book-transactions?${query}`
      : `${baseUrl}/book-transactions`;
    const response = await RequestHandler.get(url);
    return response.data;
  },
};

export default bookInventoryAPI;
