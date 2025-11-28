const http = require('http');

async function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    // Test with one of the service request IDs we found
    const requestId = '692928f2779b4d3b0fd0f720'; // Graphics service - should have 4 entries

    console.log('Testing API endpoint for request ID:', requestId);

    const options = {
      hostname: 'localhost',
      port: 8080,
      path: `/api/service-revision-history/${requestId}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          console.log('API Response:');
          console.log('Success:', jsonData.success);
          console.log('Revisions count:', jsonData.revisions ? jsonData.revisions.length : 0);

          if (jsonData.revisions) {
            jsonData.revisions.forEach((rev, idx) => {
              console.log(`Revision ${idx + 1}:`, {
                type: rev.type,
                timestamp: rev.requestedAt || rev.respondedAt || rev.timestamp,
                author: rev.requestedBy ? `${rev.requestedBy.fName} ${rev.requestedBy.lName}` :
                       rev.respondedBy ? `${rev.requestedBy.fName} ${rev.respondedBy.lName}` :
                       rev.by || 'Unknown'
              });
            });
          }
          resolve();
        } catch (err) {
          console.log('Raw response:', data);
          resolve();
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
      reject(err);
    });

    req.end();
  });
}

testAPIEndpoint().catch(console.error);