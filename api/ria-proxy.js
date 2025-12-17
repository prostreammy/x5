// File: ria-proxy.js (Updated for Performance)

export default async function handler(req, res) {
    const BASE_URL = "https://load.perfecttv.net/mpd/ria/";
    const MANIFEST_URL = "https://load.perfecttv.net/mpd/ria/manifest.mpd?username=vip_r32bmh1k&password=yb7IpqrB&channel=riafhd";
    
    const startTime = Date.now();
    let targetUrl;
    const { url } = req;
    const queryString = url.split('?')[1];

    // Determine if this is a manifest or segment request
    const isManifestRequest = !(queryString && queryString.includes('segment='));

    if (isManifestRequest) {
        targetUrl = MANIFEST_URL;
    } else {
        const segmentName = new URLSearchParams(queryString).get('segment');
        targetUrl = BASE_URL + segmentName;
    }

    try {
        const fetchStartTime = Date.now();
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Accept-Encoding': 'gzip, deflate, br' // Ask for compressed content
            }
        });
        const fetchEndTime = Date.now();
        console.log(`[PERF] Fetch to ${targetUrl} took ${fetchEndTime - fetchStartTime}ms`);

        if (!response.ok) {
            console.error(`Error from target server: ${response.status} ${response.statusText}`);
            return res.status(response.status).send(`Error from target server: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const data = await response.arrayBuffer();

        const endTime = Date.now();
        console.log(`[PERF] Total proxy execution time: ${endTime - startTime}ms`);

        // Set headers for the response to the player
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        // --- CACHING STRATEGY ---
        if (isManifestRequest) {
            // Cache the manifest for 60 seconds at the edge
            // This is the most important change for performance
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
        } else {
            // Do not cache segments, as they are time-sensitive
            res.setHeader('Cache-Control', 'no-store, max-age=0');
        }
        
        res.status(200).send(Buffer.from(data));
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).send("Proxy Error: " + error.message);
    }
}
