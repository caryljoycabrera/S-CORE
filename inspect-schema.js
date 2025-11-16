const mongoose = require('mongoose');
const ServiceRequest = require('./models/ServiceRequest');

console.log('SERVICE REQUEST SCHEMA:');
console.log(JSON.stringify(ServiceRequest.schema.obj, null, 2));

console.log('\n\nREVISION HISTORY FIELD TYPE:');
const revHistField = ServiceRequest.schema.path('revisionHistory');
console.log('Type:', revHistField);
console.log('Instance:', revHistField?.instance);
console.log('Options:', revHistField?.options);
console.log('Schema:', revHistField?.schema);
