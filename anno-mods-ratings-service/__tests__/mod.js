const { it, expect, beforeAll, afterAll } = require('@jest/globals');
const yaml = require('js-yaml');
const fs   = require('fs');

const AWS = require('aws-sdk');

const mod = require('../api/mod');

const doc = yaml.load(fs.readFileSync('./serverless.yml', 'utf8'));

const config = process.env.JEST_WORKER_ID ? {
  endpoint: 'localhost:8000',
  sslEnabled: false,
  region: 'local-env',
} : undefined;
 
const dynamoDb = new AWS.DynamoDB(config);

beforeAll((done) => {
  process.env.MODS_RATINGS_TABLE = 'TEST_TABLE';
  try {
    dynamoDb.createTable({
      TableName: process.env.MODS_RATINGS_TABLE,
      KeySchema: doc.resources.Resources.ModsRatingsTable.Properties.KeySchema,
      AttributeDefinitions: doc.resources.Resources.ModsRatingsTable.Properties.AttributeDefinitions,
      ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
    }, done);
  } catch (err) {
    done(err);
  }
});

afterAll(done => {
  try {
    console.log("Deleting table");
    dynamoDb.deleteTable({
      TableName: process.env.MODS_RATINGS_TABLE,
    }, done);
  } catch (err) {
    console.log("Error deleting table");
    done(err);
  }
});

describe('successful usage', () => {
  it('should successfully like "modId"', (done) => {
    const userId = 'userId';
    const modId = 'modId';
    const requestBody = {
      userId,
      modId,
    };
    const event = {
      body: JSON.stringify(requestBody),
    };
    const context = {};
    
    mod.like(event, context, (error, response) => {
      try {
        expect(error).toBeNull();
        expect(JSON.parse(response.body)).toStrictEqual({
          success: true,
          modId,
          likesCount: 1,
        });
        expect(response.statusCode).toBe(200);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should successfully unlike "modId"', (done) => {
    const userId = 'userId';
    const modId = 'modId';
    const requestBody = {
      userId,
      modId,
    };
    const event = {
      body: JSON.stringify(requestBody),
    };
    const context = {};
    const callback = jest.fn();
    
    mod.unlike(event, context, (error, response) => {
      try {
        expect(error).toBeNull();
        expect(JSON.parse(response.body)).toStrictEqual({
          success: true,
          modId,
          likesCount: 0,
        });
        expect(response.statusCode).toBe(200);
        done();
      } catch (err) {
        done(err);
      }
    });
  });

  it('should successfully get "modId" likes', (done) => {
    const userId = 'userId';
    const modId = 'modId';
    const requestBody = {
      userId,
      modId,
    };
    const event = {
      body: JSON.stringify(requestBody),
    };
    
    mod.like(event, {}, () => {});
    
    mod.list({}, {}, (error, response) => {
      try {
        expect(error).toBeNull();
        expect(JSON.parse(response.body)).toStrictEqual({
          success: true,
          mods: [
            {
              modId,
              likesCount: 1,
            },
          ],
        });
        expect(response.statusCode).toBe(200);
        done();
      } catch (err) {
        done(err);
      }
    });
  });
});