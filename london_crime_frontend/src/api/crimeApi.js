import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const fetchSummary = (params = {}) =>
    api.get('/summary/', { params }).then(r => r.data);

export const fetchBoroughs = (params = {}) =>
    api.get('/boroughs/', { params }).then(r => r.data);

export const fetchAreaTypes = () =>
    api.get('/area-types/').then(r => r.data);

export const fetchOffenceGroups = () =>
    api.get('/offence-groups/').then(r => r.data);

export const fetchDateRange = () =>
    api.get('/date-range/').then(r => r.data);

export const fetchBoroughTotals = (params = {}) =>
    api.get('/borough-totals/', { params }).then(r => r.data);

export const fetchTimeSeries = (params = {}) =>
    api.get('/time-series/', { params }).then(r => r.data);

export const fetchOffenceSubgroups = (params = {}) =>
    api.get('/offence-subgroups/', { params }).then(r => r.data);

export const fetchOffenceBreakdown = (params = {}) =>
    api.get('/offence-breakdown/', { params }).then(r => r.data);

export const fetchBoroughRanking = (params = {}) =>
    api.get('/borough-ranking/', { params }).then(r => r.data);

