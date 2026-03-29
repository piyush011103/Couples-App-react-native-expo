import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ── IMPORTANT: Pick the right URL based on where you're running the app ──────
// Android Emulator  → http://10.0.2.2:5000/api
// Physical Device   → http://192.168.1.5:5000/api  (your machine's local IP)
const BASE_URL = 'http://192.168.1.5:5000/api'; // ← already set to your IP
// const BASE_URL = 'http://10.0.2.2:5000/api';
const apiClient = axios.create({
  baseURL: BASE_URL,
});

apiClient.interceptors.request.use(
  async (config) => {
    const userStr = await AsyncStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default apiClient;
