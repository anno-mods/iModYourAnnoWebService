const timers = require('timers-promises');
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB({
    endpoint: 'localhost:8000',
    sslEnabled: false,
    region: 'local-env',
    maxRetries: 0,
    httpOptions: {
      connectTimeout: 500,
      timeout: 500,
    },
})

// Allow up to 10 seconds for dynamodb to start
let retries = 10;
const retriesTimeout = 500;

const waitForDynamoDbToStart = async () => {
    try {
        await dynamodb.listTables().promise();
    } catch (error) {
        console.log('Waiting for Docker container to start...');
        await timers.setTimeout(retriesTimeout);
        if (retries-- > 0) {
            return waitForDynamoDbToStart();
        }
        throw error;
    }
}

const start = Date.now()
waitForDynamoDbToStart()
    .then(() => {
        console.log(`DynamoDB-local started after ${Date.now() - start}ms.`);
        process.exit(0);
    })
    .catch(error => {
        console.log('Error starting DynamoDB-local!', error);
        process.exit(1);
    })