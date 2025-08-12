-- CreateTable
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetTime" DATETIME NOT NULL,
    "lastRequest" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "RateLimit_clientId_key" ON "RateLimit"("clientId");

-- CreateIndex
CREATE INDEX "RateLimit_clientId_resetTime_idx" ON "RateLimit"("clientId", "resetTime");
