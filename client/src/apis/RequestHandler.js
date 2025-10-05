import RequestType from '../utils/RequestType';
import connection from './connector';

const get = async (url, config) => {
  return await handleRequest(RequestType.Get, url, null, config);
};

const post = async (url, data, config) => {
  return await handleRequest(RequestType.Post, url, data, config);
};

const put = async (url, data, config) => {
  return await handleRequest(RequestType.Put, url, data, config);
};

const del = async (url, config) => {
  return await handleRequest(RequestType.Delete, url, null, config);
};

async function handleRequest(request, url, data, config) {
  try {
    let response;
    switch (request) {
      case RequestType.Get:
        response = await connection.get(url, config);
        break;
      case RequestType.Post:
        response = await connection.post(url, data, config);
        break;
      case RequestType.Put:
        response = await connection.put(url, data, config);
        break;
      case RequestType.Delete:
        response = await connection.delete(url, config);
        break;
      default:
        throw new Error('HTTP Request not defined!');
    }
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

const RequestHandler = {
  get,
  post,
  put,
  del,
};

export default RequestHandler;
