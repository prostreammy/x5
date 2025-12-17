// api/citra-proxy.js
export default async function handler(req, res) {
    // The full URL to the manifest, including authentication parameters
    const targetUrl = "https://get.perfecttv.net/citra/citra.mpd?username=vip_r92bmh1k&password=yb3IpqrB&channel=astrocitra";

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // This specific User-Agent is crucial for this source
                'User-Agent': 'Mozilla/5.0 v3 (Linux; Android 9)'
            }
        });

        const data = await response.text();

        // Set CORS headers to allow your player to access this proxy
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // The server sends 'application/octet-stream', but we need to tell the
        // browser it's an XML file for the DASH player to work correctly.
        res.setHeader('Content-Type', 'application/dash+xml');
        
        // Prevent caching to ensure the manifest is always fresh
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        
        res.status(200).send(data);
    } catch (error) {
        console.error("Proxy error:", error);
        res.status(500).send("Error proxying the manifest");
    }
}
