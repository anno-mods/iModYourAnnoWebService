'use strict';

const AWS = require('aws-sdk');

const config = process.env.JEST_WORKER_ID ? {
  endpoint: 'localhost:8000',
  sslEnabled: false,
  region: 'local-env',
} : undefined;
 
const dynamoDb = new AWS.DynamoDB.DocumentClient(config);

module.exports.like = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const userId = requestBody.userId;
  const modId = requestBody.modId;

  if(typeof userId !== 'string' || typeof modId !== 'string') {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request body'
      }),
    });
    return;
  }

  dynamoDb.update({
    TableName: process.env.MODS_RATINGS_TABLE,
    Key: {
      id: modId,
    },
    UpdateExpression: 'ADD likes :userId',
    ExpressionAttributeValues: {
      ':userId': dynamoDb.createSet([userId]),
    },
    ReturnValues: 'ALL_NEW',
  }, (err, data) => {
    if(err) {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Could not like mod',
          err,
        }),
      });
      return;
    }

    const likesCount = data && data.Attributes && data.Attributes.likes ? data.Attributes.likes.values.length : 0;

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        modId: modId,
        likesCount: likesCount,
      }),
    };
    
    callback(null, response);
  });
};

module.exports.unlike = (event, context, callback) => {
  const requestBody = JSON.parse(event.body);
  const userId = requestBody.userId;
  const modId = requestBody.modId;

  if(typeof userId !== 'string' || typeof modId !== 'string') {
    callback(null, {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request body'
      }),
    });
    return;
  }

  dynamoDb.update({
    TableName: process.env.MODS_RATINGS_TABLE,
    Key: {
      id: modId,
    },
    UpdateExpression: 'DELETE likes :userId',
    ExpressionAttributeValues: {
      ':userId': dynamoDb.createSet([userId]),
    },
    ReturnValues: 'ALL_NEW',
  }, (err, data) => {
    if(err) {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Could not unlike mod',
          err,
        }),
      });
      return;
    }

    const likesCount = data && data.Attributes && data.Attributes.likes ? data.Attributes.likes.values.length : 0;

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        modId: modId,
        likesCount: likesCount,
      }),
    };
    
    callback(null, response);
  });
};

module.exports.list = (event, context, callback) => {
  const params = {
    TableName: process.env.MODS_RATINGS_TABLE,
  };

  dynamoDb.scan(params, (err, data) => {
    if(err) {
      callback(null, {
        statusCode: 500,
        body: JSON.stringify({
          message: 'Could not list mods',
          err,
        }),
      });
      return;
    }

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        mods: data.Items.map(mod => ({
          modId: mod.id,
          likesCount: mod.likes.values.length,
        })),
      }),
    };
    
    callback(null, response);
  });
};