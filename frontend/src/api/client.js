const BASE_URL = "http://127.0.0.1:8000";

/**
 * Generic fetch wrapper for MyLife Backend
 * @param {string} endpoint 
 * @param {object} options 
 */
export async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

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
        // 404 might return proper JSON {success: false}, so we parse first.
        let data;
        try {
            data = await response.json();
        } catch (err) {
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            throw err;
        }

        if (!data.success) {
            // Backend returned logic error
            const msg = data.error?.message || "Unknown API error";
            throw new Error(msg);
        }

        return data.data;

    } catch (err) {
        console.error(`API Call Failed (${endpoint}):`, err);
        throw err;
    }
}

export const api = {
    get: (url) => apiRequest(url, { method: 'GET' }),
    post: (url, body) => apiRequest(url, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
    put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (url) => apiRequest(url, { method: 'DELETE' })
};
