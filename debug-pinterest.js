
const https = require('https');

https.get('https://api.nexray.web.id/search/pinterest?q=cats', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.result && json.result.length > 0) {
        console.log('Sample Image URL:', json.result[0].images_url);
        
        // Test fetching the image
        const imgUrl = json.result[0].images_url;
        const origin = new URL(imgUrl).origin;
        console.log('Testing fetch with Referer:', origin);
        
        const options = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Referer": origin, // Simulating the current proxy logic
                "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
            }
        };
        
        https.get(imgUrl, options, (imgRes) => {
            console.log('Image Fetch Status:', imgRes.statusCode);
            console.log('Image Headers:', imgRes.headers);
        });
        
      } else {
        console.log('No results found');
      }
    } catch (e) {
      console.error(e);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
