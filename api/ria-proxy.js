export default async function handler(req, res) {
    const targetUrl = "https://load.perfecttv.net/mpd/ria/manifest.mpd?username=vip_r32bmh1k&password=yb7IpqrB&channel=riafhd";

    try {
        const response = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
            }
        });

        const data = await response.text();

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/dash+xml');
        res.setHeader('Cache-Control', 'no-store, max-age=0');
        
        res.status(200).send(data);
    } catch (error) {
        res.status(500).send("Proxy error");
    }
}
