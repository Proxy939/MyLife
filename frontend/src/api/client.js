const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

/**
 * Generic fetch wrapper for MyLife Backend
 * @param {string} endpoint 
 * @param {object} options 
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    // Special Handling for Download (Blob)
    if (options.responseType === 'blob') {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`Download Failed: ${res.statusText}`);
        return res.blob();
    }

    const headers = {
        // Detect if body is FormData (upload), otherwise JSON
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);

        if (response.status === 404) {
            throw new Error("404: Endpoint not found");
        }

        let data;
        try {
            data = await response.json();
        } catch (err) {
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            throw err;
        }

        if (data && data.success === false) {
            const msg = data.error?.message || "Unknown API error";
            throw new Error(msg);
        }

        return data.data;

    } catch (err) {
        console.warn(`API Call Failed (${endpoint}):`, err);
        throw err;
    }
}

export const api = {
    get: (url) => apiRequest(url, { method: 'GET' }),
    post: (url, body) => apiRequest(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => apiRequest(url, { method: 'DELETE' }),

    // New: Download Helper
    download: (url) => apiRequest(url, { method: 'GET', responseType: 'blob' })
};
