import axios from 'axios';

const connection = axios.create({
  baseURL: 'http://localhost:8000/',
});


export default connection;