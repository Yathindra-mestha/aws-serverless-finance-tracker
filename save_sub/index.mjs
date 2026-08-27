import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.NOTIFICATION_TABLE || "NotificationSubscriptions";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,POST"
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

    // Get the authenticated Cognito user
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

    // Get email from the verified Cognito token
    const email = claims.email;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Email address is not available in the Cognito token."
        })
      };
    }

    const item = {
      userId,
      email,
      updatedAt: new Date().toISOString(),
      enabled: true
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Notification subscription saved successfully.",
        subscription: item
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
          "Failed to save notification subscription."
      })
    };
  }
};