const { createEngine } = require('./packages/jsf-core/dist/index.cjs');

// Test schema with nested objects
const schema = {
    type: 'object',
    properties: {
        person: {
            type: 'object',
            properties: {
                name: { type: 'string', minLength: 2 },
                address: {
                    type: 'object',
                    properties: {
                        street: { type: 'string', minLength: 5 },
                        city: { type: 'string', minLength: 2 }
                    },
                    required: ['street', 'city']
                }
            },
            required: ['name', 'address']
        }
    }
};

// Test data with errors
const testData = {
    person: {
        name: '', // Error: minLength 2
        address: {
            street: 'a', // Error: minLength 5
            city: '' // Error: minLength 2
        }
    }
};

const engine = createEngine(schema, testData);
engine.validate();

const state = engine.getState();
console.log('Errors:', state.errors);
console.log('Error counts:', Object.fromEntries(state.errorCounts));

// Expected error counts:
// - person.name: 1 error
// - person.address.street: 1 error  
// - person.address.city: 1 error
// - person.address: 2 errors (children)
// - person: 3 errors (children)
// - root: 3 errors (children)
