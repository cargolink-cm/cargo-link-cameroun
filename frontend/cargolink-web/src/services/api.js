import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
    const token = localStorage.getItem('cargolink_token');
    if (token) {
        config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
});

export const connexion = (data) => API.post('/auth/connexion', data);
export const inscription = (data) => API.post('/auth/inscription', data);
export const getDemandesDisponibles = () => API.get('/demandes/disponibles');
export const creerDemande = (data) => API.post('/demandes', data);
export const accepterDemande = (id, data) => API.put('/demandes/' + id + '/accepter', data);

export default API;