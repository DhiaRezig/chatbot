
const randomBytes = require('crypto').randomBytes;

const AWS = require('aws-sdk');
AWS.config.update({region:'eu-west-3'});
const ddb = new AWS.DynamoDB.DocumentClient();
console.log(ddb);

exports.handler =function(event, context, callback){
  const productID = toUrlString(randomBytes(16));
  //console.log('Received event (', productID, '): ', event);
  //const requestBody = JSON.parse(event.body);
  const productName = event.body;
  
  recordProduct(productID,productName).then(() => {
    // You can use the callback function to provide a return value from your Node.js
    // Lambda functions. The first parameter is used for failed invocations. The
    // second parameter specifies the result data of the invocation.

    // Because this Lambda function is called by an API Gateway proxy integration
    // the result object must use the following structure.
    
    callback(null, {
        statusCode: 201,
        body: JSON.stringify({
            ProductID: productID,
            ProductName: productName,
            Eta: '30 seconds'
        }),
        headers: {
            'Access-Control-Allow-Origin': '*',
        },
    });
  }).catch((err) => {
    console.error(err);

    // If there is an error during processing, catch it and return
    // from the Lambda function successfully. Specify a 500 HTTP status
    // code and provide an error message in the body. This will provide a
    // more meaningful error response to the end client.
    errorResponse(err.message, context.awsRequestId, callback)
  });
};
function toUrlString(buffer) {
  return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
}
function recordProduct(productID,productName) {
  return ddb.put({
      TableName: 'product',
      Item: {
        productID: productID,
        productName: productName,
        requestTime: new Date().toISOString(),
      },
  }).promise();
}

function errorResponse(errorMessage, awsRequestId, callback) {
  callback(null, {
    statusCode: 500,
    body: JSON.stringify({
      Error: errorMessage,
      Reference: awsRequestId,
    }),
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}

