import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME =
  process.env.RECURRING_TRANSACTIONS_TABLE || "RecurringTransactions";

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

    // Get authenticated Cognito user
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

    const {
      amount,
      type,
      category,
      description,
      frequency,
      dayOfMonth,
      startDate
    } = body;

    // Validate required fields
    if (
      amount === undefined ||
      !type ||
      !category ||
      !frequency ||
      !dayOfMonth ||
      !startDate
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Required fields: amount, type, category, frequency, dayOfMonth, startDate."
        })
      };
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount < 0
    ) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Amount must be a valid non-negative number."
        })
      };
    }

    const normalizedType = String(type).toLowerCase();

    if (!["income", "expense"].includes(normalizedType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Type must be either 'income' or 'expense'."
        })
      };
    }

    const allowedFrequencies = [
      "monthly",
      "weekly",
      "daily"
    ];

    const normalizedFrequency =
      String(frequency).toLowerCase();

    if (!allowedFrequencies.includes(normalizedFrequency)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error:
            "Frequency must be monthly, weekly, or daily."
        })
      };
    }

    const recurringId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const recurringTransaction = {
      userId,
      recurringId,
      amount: numericAmount,
      type: normalizedType,
      category,
      description: description || "",
      frequency: normalizedFrequency,
      dayOfMonth: Number(dayOfMonth),
      startDate,
      active: true,
      createdAt,
      updatedAt: createdAt
    };

    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: recurringTransaction
      })
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: "Recurring transaction created successfully.",
        recurringTransaction
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
          "Failed to create recurring transaction."
      })
    };
  }
};