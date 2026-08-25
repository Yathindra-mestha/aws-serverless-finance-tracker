const domain = 'https://ap-south-1b1mtk1d8v.auth.ap-south-1.amazoncognito.com';
const clientId = '6d4m6tc2rau53b1om0ctangta4';
const uris = [
  'https://fintrack-yathindra.vercel.app/',
  'https://fintrack-yathindra.vercel.app',
  'http://fintrack-yathindra.vercel.app/',
  'http://fintrack-yathindra.vercel.app',
  'http://localhost:3000/',
  'http://localhost:3000'
];

async function check() {
  for (const uri of uris) {
    const url = domain + '/oauth2/authorize?client_id=' + clientId + '&response_type=code&redirect_uri=' + encodeURIComponent(uri);
    const res = await fetch(url, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    if (loc.includes('/login')) {
      console.log('SUCCESS FOUND! The configured redirect_uri is:', uri);
      return;
    }
  }
  console.log('None of the variations worked.');
}
check();
