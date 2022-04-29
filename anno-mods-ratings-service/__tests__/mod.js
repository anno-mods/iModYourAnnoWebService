const { it, expect, beforeAll, afterAll } = require('@jest/globals');
const yaml = require('js-yaml');
const fs   = require('fs');
const debug = require('debug')('imya:mod');

const AWS = require('aws-sdk');

const mod = require('../build/mod');

const doc = yaml.load(fs.readFileSync('./serverless.yml', 'utf8'));

const config = process.env.JEST_WORKER_ID ? {
  endpoint: 'localhost:8000',
  sslEnabled: false,
  region: 'local-env',
  maxRetries: 0,
  httpOptions: {
    connectTimeout: 500,
    timeout: 500,
  },
} : undefined;
 
const dynamoDb = new AWS.DynamoDB(config);

const dynamoDbEnabled = false;

beforeAll(async () => {
  process.env.MODS_RATINGS_TABLE = 'TEST_TABLE';
  debug('Deleting old table');
  try {
  await dynamoDb.deleteTable({ TableName: process.env.MODS_RATINGS_TABLE }).promise();
  } catch (e) {
    debug("No table to delete");
  }
  debug('Creating table');
  try {
    await dynamoDb.createTable({
      TableName: process.env.MODS_RATINGS_TABLE,
      KeySchema: doc.resources.Resources.ModsRatingsTable.Properties.KeySchema,
      AttributeDefinitions: doc.resources.Resources.ModsRatingsTable.Properties.AttributeDefinitions,
      ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
    }).promise();
    await dynamoDb.waitFor('tableExists', { TableName: process.env.MODS_RATINGS_TABLE }).promise();
    dynamoDbEnabled = true;
  } catch (e) {
    debug('Couldn\'t create table: %s', e.message);
    debug('Skipping tests requiring the DynamoDB table');
  }
});

afterAll(async () => {
  try {
    debug("Deleting table");
    await dynamoDb.deleteTable({
      TableName: process.env.MODS_RATINGS_TABLE,
    }).promise();
  } catch (err) {
    debug("Error deleting table");
  }
});

describe('should succeed', () => {
  it('like function', async () => {
    const userId = 'userId';
    const modId = 'modId';
    const requestBody = {
      userId,
      modId,
    };
    const event = {
      body: JSON.stringify(requestBody),
    };
    
    const response = await mod.like(event);
    expect(JSON.parse(response.body)).toStrictEqual({
      success: true,
      modId,
      likesCount: 1,
    });
    expect(response.statusCode).toBe(200);
  });

  it('unlike function', async () => {
    const userId = 'userId';
    const modId = 'modId';
    const requestBody = {
      userId,
      modId,
    };
    const event = {
      body: JSON.stringify(requestBody),
    };
    
    const response = await mod.unlike(event);
    expect(JSON.parse(response.body)).toStrictEqual({
      success: true,
      modId,
      likesCount: 0,
    });
    expect(response.statusCode).toBe(200);
  });

  it('list function', async () => {
    const userId = 'userId';
    const modId = 'modId';
    const requestBody = {
      userId,
      modId,
    };
    const event = {
      body: JSON.stringify(requestBody),
    };
    
    await mod.like(event, {}, () => {});
    
    const response = await mod.list({});
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
  });
});

describe('should fail', () => {
  describe("like function", () => {
    it('when missing modId', async () => {
      const userId = 'userId';
      const requestBody = {
        userId,
      };
      const event = {
        body: JSON.stringify(requestBody),
      };
      
      const response = await mod.like(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });

    it('when missing userId', async () => {
      const modId = 'modId';
      const requestBody = {
        modId,
      };
      const event = {
        body: JSON.stringify(requestBody),
      };
      
      const response = await mod.like(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });

    it('when userId is not a string', async () => {
      const userId = 1;
      const modId = 'modId';
      const requestBody = {
        userId,
        modId,
      };
      const event = {
        body: JSON.stringify(requestBody),
      };
      
      const response = await mod.like(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });

    it('when no body is provided', async () => {
      const event = {};
      
      const response = await mod.like(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });
  });

  describe("unlike function", () => {
    it('when missing modId', async () => {
      const userId = 'userId';
      const requestBody = {
        userId,
      };
      const event = {
        body: JSON.stringify(requestBody),
      };
      
      const response = await mod.unlike(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });

    it('when missing userId', async () => {
      const modId = 'modId';
      const requestBody = {
        modId,
      };
      const event = {
        body: JSON.stringify(requestBody),
      };
      
      const response = await mod.unlike(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });

    it('when userId is not a string', async () => {
      const userId = 1;
      const modId = 'modId';
      const requestBody = {
        userId,
        modId,
      };
      const event = {
        body: JSON.stringify(requestBody),
      };
      
      const response = await mod.unlike(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });

    it('when no body is provided', async () => {
      const event = {};
      
      const response = await mod.unlike(event);
      expect(JSON.parse(response.body)).toStrictEqual({
        message: "Invalid request body",
      });
      expect(response.statusCode).toBe(400);
    });
  });
});