import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.RECURRING_TRANSACTIONS_TABLE || "RecurringTransactions";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "OPTIONS,PUT"
};

// Editable fields and their validation rules
const EDITABLE_FIELDS = {
  amount: (v) => typeof v === "number" && v > 0,
  type: (v) => v === "income" || v === "expense",
  category: (v) => typeof v === "string" && v.trim().length > 0,
  description: (v) => typeof v === "string" && v.trim().length > 0,
  frequency: (v) => v === "monthly",
  dayOfMonth: (v) => typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 31,
  startDate: (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v),
  active: (v) => typeof v === "boolean"
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

    // Get authenticated user from Cognito JWT
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

    // Get recurringId from API Gateway path
    const recurringId =
      event?.pathParameters?.recurringId;

    if (!recurringId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "recurringId is required."
        })
      };
    }

    // Parse request body
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Request body is required."
        })
      };
    }

    let body;

    try {
      body =
        typeof event.body === "string"
          ? JSON.parse(event.body)
          : event.body;
    } catch {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Request body must be valid JSON."
        })
      };
    }

    // Build dynamic update expression from editable fields
    const updateNames = {};
    const updateValues = {};
    const setClauses = [];

    for (const [field, validator] of Object.entries(EDITABLE_FIELDS)) {
      if (body[field] !== undefined) {
        if (!validator(body[field])) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              error: `Invalid value for '${field}'.`
            })
          };
        }
        const attrName = `#${field}`;
        const attrValue = `:${field}`;
        updateNames[attrName] = field;
        updateValues[attrValue] = body[field];
        setClauses.push(`${attrName} = ${attrValue}`);
      }
    }

    if (setClauses.length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "No valid fields to update."
        })
      };
    }

    // Always update updatedAt
    const updatedAt = new Date().toISOString();
    updateNames["#updatedAt"] = "updatedAt";
    updateValues[":updatedAt"] = updatedAt;
    setClauses.push("#updatedAt = :updatedAt");

    const updateExpression = `SET ${setClauses.join(", ")}`;

    const result = await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          recurringId
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: updateNames,
        ExpressionAttributeValues: updateValues,
        ConditionExpression: "attribute_exists(userId) AND attribute_exists(recurringId)",
        ReturnValues: "ALL_NEW"
      })
    );

    if (!result.Attributes) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "Recurring transaction not found."
        })
      };
    }

    // Determine response message based on what was updated
    let message = "Recurring transaction updated successfully.";
    if (Object.keys(body).length === 1 && typeof body.active === "boolean") {
      message = body.active
        ? "Recurring transaction resumed successfully."
        : "Recurring transaction paused successfully.";
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message,
        recurringTransaction: result.Attributes
      })
    };

  } catch (error) {
    console.error("Lambda execution error:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "Recurring transaction not found for this user."
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        message:
          error.message ||
          "Failed to update recurring transaction."
      })
    };
  }
};