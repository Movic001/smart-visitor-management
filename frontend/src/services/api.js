import axios from 'axios'

// Base Laravel API URL.
const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Send Laravel's session cookies with requests.
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export default api