import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const sql = `
    CREATE TABLE IF NOT EXISTS mollie_webhook_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      molliePaymentId VARCHAR(100),
      mollieStatus VARCHAR(50),
      eventType VARCHAR(50) NOT NULL,
      orderId INT,
      orderNumber VARCHAR(50),
      savTicketId INT,
      httpStatusCode INT NOT NULL,
      processingTimeMs INT,
      rawPayload TEXT,
      mollieResponsePayload TEXT,
      previousOrderStatus VARCHAR(50),
      newOrderStatus VARCHAR(50),
      errorMessage TEXT,
      ipAddress VARCHAR(45),
      success BOOLEAN NOT NULL DEFAULT TRUE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX mwl_paymentId_idx (molliePaymentId),
      INDEX mwl_orderId_idx (orderId),
      INDEX mwl_createdAt_idx (createdAt),
      INDEX mwl_success_idx (success)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.execute(sql);
  console.log("Table mollie_webhook_logs created successfully!");
  
  await connection.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
