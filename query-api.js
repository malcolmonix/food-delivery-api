// Query the GraphQL API to see restaurant data
const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/graphql';

async function queryAPI() {
    console.log('🔍 Querying GraphQL API for Restaurant Data\n');
    console.log('='.repeat(80));

    // You'll need a valid auth token - replace this with your actual token
    const token = 'YOUR_AUTH_TOKEN_HERE';

    // Query all restaurants
    const restaurantsQuery = {
        query: `
      query GetRestaurants {
        restaurants {
          id
          name
          description
          logoUrl
          bannerUrl
          contactEmail
          phoneNumber
          address
          cuisine
          priceRange
          rating
          reviewCount
          isActive
          createdAt
        }
      }
    `
    };

    try {
        console.log('\n📡 Fetching all restaurants...\n');
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(restaurantsQuery)
        });

        const result = await response.json();

        if (result.errors) {
            console.error('❌ GraphQL Errors:', JSON.stringify(result.errors, null, 2));
        } else {
            console.log(`✅ Found ${result.data.restaurants.length} restaurants:\n`);
            console.table(result.data.restaurants.map(r => ({
                Name: r.name,
                Description: r.description?.substring(0, 40) + '...',
                Email: r.contactEmail || '(none)',
                Phone: r.phoneNumber || '(none)',
                Logo: r.logoUrl ? '✓' : '✗',
                Banner: r.bannerUrl ? '✓' : '✗',
                Active: r.isActive ? '✓' : '✗',
                Rating: r.rating || 'N/A'
            })));

            console.log('\n📝 Full restaurant data:');
            console.log(JSON.stringify(result.data.restaurants, null, 2));
        }
    } catch (error) {
        console.error('❌ Error querying API:', error.message);
    }

    console.log('\n' + '='.repeat(80));
}

queryAPI();
