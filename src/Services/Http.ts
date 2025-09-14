//#region Global Imports

import qs  from 'query-string';
//#endregion Global Imports

//const BaseUrl = `${process.env.API_URL}/api`;

// const BaseUrl = import.meta.env.VITE_API_URL;
const BaseUrl = '';

export const Http = {
    Request: async (methodType, url, params, payload) => {
        return new Promise((resolve, reject) => {
            const query = params ? `?${qs.stringify(params)}` : '';
            console.log(payload)
            window
                .fetch(`${BaseUrl}${url}${query}`, {
                    body: payload,
                    
                    
                    method: `${methodType}`,
                })
                .then(async response => {
                    if (response.status === 200) {
                        return response.json().then(resolve);
                    } else {
                        return reject(response);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    },
};

export const HttpAuth = {
    Request: async (methodType, url, params, payload,token ) => {
        console.log(token)
        return new Promise((resolve, reject) => {
            const query = params ? `?${qs.stringify(params)}` : '';
            window
                .fetch(`${BaseUrl}${url}${query}`, {
                    body: JSON.stringify(payload),
                    cache: 'no-cache',
                    headers: {
                        'content-type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    method: `${methodType}`,
                })
                .then(async response => {
                    if (response.status === 200) {
                        return response.json().then(resolve);
                    } else {
                        return reject(response);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    },
};
