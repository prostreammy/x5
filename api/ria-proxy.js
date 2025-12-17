// File: ria-proxy.js (Updated for Robustness and Debugging)

export default async function handler(req, res) {
    const BASE_URL = "https://load.perfecttv.net/mpd/ria/";
    const MANIFEST_URL = "https://load.perfecttv.net/mpd/ria/manifest.mpd?username=vip_r32bmh1k&password=yb7IpqrB&channel=riafhd";

    let targetUrl;

    // Use req.query for more reliable access to query parameters in Next.js/Vercel
    if (req.query && req.query.segment) {
        // This is a request for a media segment
        const segmentName = req.query.segment;
        targetUrl = BASE_URL + segmentName;
        console.log(`[PROXY-DEBUG] Received segment request for: ${segmentName}`);
        console.log(`[PROXY-DEBUG] Forwarding to: ${targetUrl}`);
    } else {
        // This is a request for the main manifest
        targetUrl = MANIFEST_URL;
        console.log(`[PROXY-DEBUG] Received manifest request.`);
        console.log(`[PROXY-DEBUG] Forwarding to: ${targetUrl}`);
    }

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
                'Accept-Encoding': 'gzip, deflate, br'
            }
        });

        // If the original server responds with an error, forward that exact error
        if (!response.ok) {
            const errorText = await response.text(); // Get error body for more info
            console.error(`[PROXY-ERROR] Origin server responded with ${response.status} ${response.statusText}`);
            console.error(`[PROXY-ERROR] Origin server body: ${errorText}`);
            return res.status(response.status).send(errorText);
        }

        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        const data = await response.arrayBuffer();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', contentType);

        // Cache manifest for 60s, but not segments
        if (!req.query.segment) {
            res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
        } else {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
        }
        
        res.status(200).send(Buffer.from(data));
    } catch (error) {
        console.error('[PROXY-CRITICAL-ERROR] Fetch failed:', error);
        res.status(500).send("Proxy Critical Error: " + error.message);
    }
}
