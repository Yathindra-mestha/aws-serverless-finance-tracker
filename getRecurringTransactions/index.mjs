import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.RECURRING_TRANSACTIONS_TABLE || "RecurringTransactions";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const method =
      event?.requestContext?.http?.method || event?.httpMethod;

    if (method === "OPTIONS") {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: "OK" })
      };
    }

    // Get the authenticated user from Cognito JWT
    const claims =
      event?.requestContext?.authorizer?.jwt?.claims;

    if (!claims?.sub) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: "Unauthorized",
          message: "Missing authenticated Cognito user."
        })
      };
    }

    const userId = claims.sub;

    // Get only this user's recurring transaction rules
    const result = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        }
      })
    );

    const recurringTransactions = result.Items || [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        count: recurringTransactions.length,
        recurringTransactions
      })
    };

  } catch (error) {
    console.error("Lambda execution error:", error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message:
          error.message ||
          "Failed to retrieve recurring transactions."
      })
    };
  }
};