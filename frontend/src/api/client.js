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

        // Handle 404 specifically for feature detection (optional UI logic often needs to know this)
        if (response.status === 404) {
            throw new Error("404: Endpoint not found");
        }

        // Attempt to parse JSON
        let data;
        try {
            data = await response.json();
        } catch (err) {
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            throw err;
        }

        // Check application-level success flag
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
    delete: (url) => apiRequest(url, { method: 'DELETE' })
};
