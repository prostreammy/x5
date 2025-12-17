// File: ria-proxy.js

// This would be a serverless function in a framework like Next.js
// For example: pages/api/ria-proxy.js

export default async function handler(req, res) {
    // The base URL for all RIA media assets
    const BASE_URL = "https://load.perfecttv.net/mpd/ria/";

    // The full URL for the manifest, including credentials
    const MANIFEST_URL = "https://load.perfecttv.net/mpd/ria/manifest.mpd?username=vip_r32bmh1k&password=yb7IpqrB&channel=riafhd";

    // Determine the target URL based on the incoming request
    let targetUrl;
    const { url } = req;
    const queryString = url.split('?')[1];

    if (queryString && queryString.includes('segment=')) {
        // This is a request for a media segment
        const segmentName = new URLSearchParams(queryString).get('segment');
        targetUrl = BASE_URL + segmentName;
    } else {
        // This is a request for the main manifest
        targetUrl = MANIFEST_URL;
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
            }
        });

        // If the original server responded with an error, forward that error
        if (!response.ok) {
            console.error(`Error from target server: ${response.status} ${response.statusText}`);
            return res.status(response.status).send(`Error from target server: ${response.statusText}`);
        }

        // Get content type from the original response to forward it
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        
        // Get the data as an ArrayBuffer to handle both text (manifest) and binary (segments)
        const data = await response.arrayBuffer();

        // Set headers for the response to the player
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        
        // Send the data back to the player
        res.status(200).send(Buffer.from(data));
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send("Proxy Error: " + error.message);
    }
}
