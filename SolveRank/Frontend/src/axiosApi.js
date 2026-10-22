import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default instance;
