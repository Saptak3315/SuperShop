import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3333',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

export default api
