import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const RECURRING_TABLE =
  process.env.RECURRING_TRANSACTIONS_TABLE || "RecurringTransactions";

const TRANSACTIONS_TABLE =
  process.env.TRANSACTIONS_TABLE || "Transactions";

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const today = new Date();
    const todayDate = today.toISOString().slice(0, 10);
    const currentDay = today.getUTCDate();

    // Find active recurring transaction rules
    const result = await docClient.send(
      new ScanCommand({
        TableName: RECURRING_TABLE,
        FilterExpression: "active = :active",
        ExpressionAttributeValues: {
          ":active": true
        }
      })
    );

    const recurringRules = result.Items || [];

    const processed = [];
    const skipped = [];
    const failed = [];

    for (const rule of recurringRules) {
      try {
        const frequency = String(rule.frequency).toLowerCase();

        // For this first version, process monthly rules only.
        if (frequency !== "monthly") {
          skipped.push({
            recurringId: rule.recurringId,
            reason: "Only monthly recurrence is processed."
          });
          continue;
        }

        // Only run on the configured day of the month.
        if (Number(rule.dayOfMonth) !== currentDay) {
          skipped.push({
            recurringId: rule.recurringId,
            reason: "Not due today."
          });
          continue;
        }

        // Respect the rule's start date.
        if (
          rule.startDate &&
          todayDate < String(rule.startDate).slice(0, 10)
        ) {
          skipped.push({
            recurringId: rule.recurringId,
            reason: "Start date has not been reached."
          });
          continue;
        }

        // Prevent duplicate creation if this rule has already
        // been processed for this calendar month.
        const currentMonth = todayDate.slice(0, 7);

        if (rule.lastProcessedMonth === currentMonth) {
          skipped.push({
            recurringId: rule.recurringId,
            reason: "Already processed this month."
          });
          continue;
        }

        const transactionId = crypto.randomUUID();
        const createdAt = new Date().toISOString();

        const transaction = {
          userId: rule.userId,
          transactionId,
          amount: Number(rule.amount) || 0,
          type: rule.type,
          category: rule.category,
          date: todayDate,
          description: rule.description || "",
          createdAt,
          recurringId: rule.recurringId,
          recurring: true
        };

        // Create the actual transaction
        await docClient.send(
          new PutCommand({
            TableName: TRANSACTIONS_TABLE,
            Item: transaction
          })
        );

        // Update the recurring rule to prevent duplicates
        await docClient.send(
          new UpdateCommand({
            TableName: RECURRING_TABLE,
            Key: {
              userId: rule.userId,
              recurringId: rule.recurringId
            },
            UpdateExpression: "SET lastProcessedMonth = :currentMonth",
            ConditionExpression: "attribute_not_exists(lastProcessedMonth) OR lastProcessedMonth <> :currentMonth",
            ExpressionAttributeValues: {
              ":currentMonth": currentMonth
            }
          })
        );

        processed.push({
          recurringId: rule.recurringId,
          transactionId,
          userId: rule.userId
        });
      } catch (error) {
        console.error(
          `Failed processing recurring rule ${rule.recurringId}:`,
          error
        );

        failed.push({
          recurringId: rule.recurringId,
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        date: todayDate,
        processedCount: processed.length,
        skippedCount: skipped.length,
        failedCount: failed.length,
        processed,
        skipped,
        failed
      })
    };
  } catch (error) {
    console.error("Processor Lambda error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        message:
          error.message ||
          "Failed to process recurring transactions."
      })
    };
  }
};