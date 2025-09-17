const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

/**
 * Parse read endpoints from environment variable
 * Format: "Name1:https://url1,Name2:https://url2,Name3:https://url3"
 * @returns {Array} Array of endpoint objects with name and url properties
 */
function parseReadEndpoints() {
  const endpointsEnv = process.env.SOLANA_READ_ENDPOINTS;
  if (!endpointsEnv) {
    throw new Error('SOLANA_READ_ENDPOINTS environment variable is not set');
  }
  
  return endpointsEnv.split(',').map(pair => {
    // Split on the first colon only (since URLs have colons too)
    const colonIndex = pair.indexOf(':');
    if (colonIndex === -1) {
      throw new Error(`Invalid endpoint format in SOLANA_READ_ENDPOINTS: ${pair}`);
    }
    
    const name = pair.substring(0, colonIndex).trim();
    const url = pair.substring(colonIndex + 1).trim();
    
    if (!name || !url) {
      throw new Error(`Invalid endpoint format in SOLANA_READ_ENDPOINTS: ${pair}`);
    }
    return {
      name: name,
      shortName: name,
      url: url
    };
  });
}

/**
 * Get write endpoint from environment variable
 * @returns {string} Write endpoint URL
 */
function getWriteEndpoint() {
  const writeEndpoint = process.env.SOLANA_WRITE_ENDPOINT;
  if (!writeEndpoint) {
    throw new Error('SOLANA_WRITE_ENDPOINT environment variable is not set');
  }
  return writeEndpoint;
}

/**
 * Get all endpoints (read + write) in the format expected by existing code
 * @returns {Array} Array of all endpoint objects
 */
function getAllEndpoints() {
  const readEndpoints = parseReadEndpoints();
  const writeEndpoint = getWriteEndpoint();
  
  // Add write endpoint as a special endpoint
  const writeEndpointObj = {
    name: 'Write Endpoint',
    shortName: 'Write Endpoint', 
    url: writeEndpoint
  };
  
  return [...readEndpoints, writeEndpointObj];
}

/**
 * Get healthy endpoints (read endpoints only) for status checking
 * This replaces the old healthy-endpoints.json5 functionality
 * @returns {Array} Array of read endpoint objects
 */
function getHealthyEndpoints() {
  return parseReadEndpoints();
}

module.exports = {
  parseReadEndpoints,
  getWriteEndpoint,
  getAllEndpoints,
  getHealthyEndpoints
};
