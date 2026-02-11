// Script to subscribe Market Spas pages to leadgen webhook
// Uses the user token from Graph API Explorer to get page tokens,
// then subscribes each Market Spas page to leadgen webhook

import https from 'https';

// The user token from Graph API Explorer (with pages_manage_metadata + leads_retrieval permissions)
// We'll pass it as argument
const USER_TOKEN = process.argv[2];
if (!USER_TOKEN) {
  console.error('Usage: node setup-leadgen-webhook.mjs <USER_ACCESS_TOKEN>');
  process.exit(1);
}

function graphGet(path, token) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v24.0/${path}${path.includes('?') ? '&' : '?'}access_token=${token}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

function graphPost(path, token, body = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const url = new URL(`https://graph.facebook.com/v24.0/${path}`);
    url.searchParams.set('access_token', token);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getAllPages(userToken) {
  const allPages = [];
  let url = `me/accounts?limit=100`;
  
  while (url) {
    const result = await graphGet(url, userToken);
    if (result.data) {
      allPages.push(...result.data);
    }
    // Handle pagination
    if (result.paging && result.paging.next) {
      // Extract the path after graph.facebook.com/v24.0/
      const nextUrl = new URL(result.paging.next);
      url = nextUrl.pathname.replace('/v24.0/', '') + nextUrl.search;
    } else {
      url = null;
    }
  }
  
  return allPages;
}

async function main() {
  console.log('=== Setup Leadgen Webhook for Market Spas Pages ===\n');
  
  // Step 1: Get all pages
  console.log('1. Fetching all pages...');
  const allPages = await getAllPages(USER_TOKEN);
  console.log(`   Found ${allPages.length} pages total.\n`);
  
  // Step 2: Filter Market Spas pages
  const marketSpasPages = allPages.filter(p => 
    p.name.toLowerCase().includes('market spa')
  );
  
  console.log(`2. Market Spas pages found: ${marketSpasPages.length}`);
  for (const page of marketSpasPages) {
    console.log(`   - ${page.name} (ID: ${page.id})`);
  }
  console.log();
  
  // Also show all pages for reference
  console.log('   All pages:');
  for (const page of allPages) {
    const isMarket = page.name.toLowerCase().includes('market spa') ? ' ★' : '';
    console.log(`   - ${page.name} (ID: ${page.id})${isMarket}`);
  }
  console.log();
  
  // Step 3: Subscribe each Market Spas page to leadgen webhook
  console.log('3. Subscribing Market Spas pages to leadgen webhook...\n');
  
  for (const page of marketSpasPages) {
    console.log(`   Subscribing "${page.name}" (${page.id})...`);
    
    // First check current subscriptions
    const subs = await graphGet(`${page.id}/subscribed_apps`, page.access_token);
    console.log(`   Current subscriptions:`, JSON.stringify(subs));
    
    // Subscribe to leadgen
    const result = await graphPost(`${page.id}/subscribed_apps`, page.access_token, {
      subscribed_fields: ['leadgen']
    });
    
    if (result.success) {
      console.log(`   ✅ Successfully subscribed to leadgen!`);
    } else {
      console.log(`   ❌ Failed:`, JSON.stringify(result));
    }
    
    // Verify subscription
    const verifySubs = await graphGet(`${page.id}/subscribed_apps`, page.access_token);
    console.log(`   Verified subscriptions:`, JSON.stringify(verifySubs));
    console.log();
  }
  
  console.log('=== Done ===');
}

main().catch(console.error);
