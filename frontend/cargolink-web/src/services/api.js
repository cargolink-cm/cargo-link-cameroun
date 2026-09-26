import axios from 'axios';

const API = axios.create({
    baseURL: 'https://cargo-link-cameroun-production.up.railway.app/api'
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
export const proposerOffre = (id, data) => API.post('/demandes/' + id + '/proposer', data);
export const getPropositions = (id) => API.get('/demandes/' + id + '/propositions');
export const choisirProposition = (id, propositionId) => API.put('/demandes/' + id + '/choisir-proposition', { proposition_id: propositionId });
export const getMesDemandes = () => API.get('/demandes/mes-demandes');
export const getMesDemandesTransporteur = () => API.get('/demandes/mes-demandes-transporteur');

export const changerMotDePasse = (data) => API.put('/auth/changer-mot-de-passe', data);

export default API;