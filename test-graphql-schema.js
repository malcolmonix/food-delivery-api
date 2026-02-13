// Test GraphQL schema introspection
const axios = require('axios');

async function testSchema() {
    try {
        const response = await axios.post('http://localhost:4000/graphql', {
            query: `
                query {
                    __type(name: "OrderTracking") {
                        fields {
                            name
                            type {
                                name
                                kind
                                ofType {
                                    name
                                }
                            }
                        }
                    }
                }
            `
        });

        console.log('OrderTracking type fields:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error:', error.response?.data || error.message);
    }
}

testSchema();
