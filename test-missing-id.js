const fetch = require('node-fetch');

const API_URL = 'http://localhost:4000/graphql';

async function testMissingId() {
    const mutation = `
    mutation UpdateRestaurant(
      $id: ID!, 
      $name: String
    ) {
      updateRestaurant(
        id: $id, 
        name: $name
      ) {
        id
      }
    }
  `;

    // Missing 'id' variable
    const variables = {
        name: "Updated Name Test"
    };

    console.log('Sending mutation with missing ID...');

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: mutation,
                variables: variables
            })
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);

    } catch (error) {
        console.error('Error:', error);
    }
}

testMissingId();
