import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "https://chatty-be-mjiw.onrender.com" : "/api",
  withCredentials: true,
});
