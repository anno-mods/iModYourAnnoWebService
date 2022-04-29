import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { DynamoDB } from 'aws-sdk';

const config = process.env.JEST_WORKER_ID ? {
  endpoint: `localhost:${process.env.DYNAMODB_PORT || 8000}`,
  sslEnabled: false,
  region: 'local-env',
  httpOptions: {
    connectTimeout: 500,
    timeout: 500,
  },
} : undefined;
 
const dynamoDb = new DynamoDB.DocumentClient(config);

export const like = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestBody = JSON.parse(event.body || '{}');
  const userId = requestBody.userId;
  const modId = requestBody.modId;

  if(typeof userId !== 'string' || typeof modId !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request body'
      }),
    };
  }

  try {
    const data = await dynamoDb.update({
      TableName: process.env.MODS_RATINGS_TABLE,
      Key: {
        id: modId,
      },
      UpdateExpression: 'ADD likes :userId',
      ExpressionAttributeValues: {
        ':userId': dynamoDb.createSet([userId]),
      },
      ReturnValues: 'ALL_NEW',
    }).promise();

    const likesCount = data && data.Attributes && data.Attributes.likes ? data.Attributes.likes.values.length : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        modId: modId,
        likesCount: likesCount,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not like mod',
        err,
      }),
    };
  }
};

export const unlike = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const requestBody = JSON.parse(event.body || '{}');
  const userId = requestBody.userId;
  const modId = requestBody.modId;

  if(typeof userId !== 'string' || typeof modId !== 'string') {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid request body'
      }),
    };
  }

  try {
    const data = await dynamoDb.update({
      TableName: process.env.MODS_RATINGS_TABLE,
      Key: {
        id: modId,
      },
      UpdateExpression: 'DELETE likes :userId',
      ExpressionAttributeValues: {
        ':userId': dynamoDb.createSet([userId]),
      },
      ReturnValues: 'ALL_NEW',
    }).promise();

    const likesCount = data && data.Attributes && data.Attributes.likes ? data.Attributes.likes.values.length : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        modId: modId,
        likesCount: likesCount,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not unlike mod',
        err,
      }),
    };
  }
};

export const list = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const params = {
    TableName: process.env.MODS_RATINGS_TABLE,
  };

  try {
    const data = await dynamoDb.scan(params).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        mods: data.Items.map(mod => ({
          modId: mod.id,
          likesCount: mod.likes.values.length,
        })),
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Could not list mods',
        err,
      }),
    };
  }
};