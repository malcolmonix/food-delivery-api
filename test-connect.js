const http = require('http');

console.log('Creating HTTP request...');

const options = {
  hostname: 'localhost',
  port: 4001,
  path: '/',
  method: 'GET'
};

console.log('Options:', options);

const req = http.request(options, (res) => {
  console.log('Response received!');
  console.log('Server responded with status:', res.statusCode);
  let body = '';
  res.on('data', (chunk) => {
    console.log('Received data chunk');
    body += chunk;
  });
  res.on('end', () => {
    console.log('Response ended');
    console.log('Response body:', body);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  console.error('Error code:', err.code);
  console.error('Error details:', err);
});

console.log('Sending request...');
req.end();
console.log('Request sent');