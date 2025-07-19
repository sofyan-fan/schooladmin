import connection from './connection/connector';
import RequestType from '../utils/RequestType';

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
  let result = {};
  try {
    switch (request) {
      case RequestType.Get:
        result = await connection.get(url, config);
        break;

      case RequestType.Post:
        result = await connection.post(url, data, config);
        break;

      case RequestType.Put:
        result = await connection.put(url, data, config);
        break;

      case RequestType.Delete:
        result = await connection.delete(url, config);
        break;

      default:
        throw new Error('HTTP Request not defined!');
    }
  } catch (error) {
    return error.response;
  }
  return result;
}

const RequestHandler = {
  get,
  post,
  put,
  del,
};

export default RequestHandler;