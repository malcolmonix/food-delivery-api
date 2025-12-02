// Query GraphQL API and show restaurant structure
const fetch = require('node-fetch');
const fs = require('fs');

const API_URL = 'http://localhost:4000/graphql';

async function queryRestaurants() {
    const query = {
        query: `{
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
      }
    }`
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query)
        });

        const result = await response.json();

        // Write to file
        fs.writeFileSync('restaurants-data.json', JSON.stringify(result, null, 2));

        console.log('✅ Restaurant data saved to restaurants-data.json');
        console.log(`\n📊 Summary:`);
        console.log(`- Total restaurants: ${result.data?.restaurants?.length || 0}`);

        if (result.data?.restaurants?.length > 0) {
            result.data.restaurants.forEach((r, i) => {
                console.log(`\n${i + 1}. ${r.name}`);
                console.log(`   Email: ${r.contactEmail || 'N/A'}`);
                console.log(`   Phone: ${r.phoneNumber || 'N/A'}`);
                console.log(`   Logo: ${r.logoUrl ? 'Yes' : 'No'}`);
                console.log(`   Banner: ${r.bannerUrl ? 'Yes' : 'No'}`);
                console.log(`   Active: ${r.isActive}`);
            });
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

queryRestaurants();
