import axios from 'axios';
import keycloak from '../keycloak';

const apiClient = axios.create({
    baseURL: 'http://localhost:8000',
});

apiClient.interceptors.request.use(
    (config) => {
        if (keycloak.authenticated && keycloak.token) {
            config.headers.Authorization = `Bearer ${keycloak.token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;