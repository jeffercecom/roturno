-- CreateTable
CREATE TABLE "AdvisorAttribute" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    CONSTRAINT "AdvisorAttribute_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ServiceCategoryDuration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "categoryId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "price" REAL NOT NULL,
    CONSTRAINT "ServiceCategoryDuration_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvisorServiceCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    CONSTRAINT "AdvisorServiceCategory_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdvisorServiceCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Advisor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "presentation" TEXT,
    "presentationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "inPerson" BOOLEAN NOT NULL DEFAULT false,
    "virtual" BOOLEAN NOT NULL DEFAULT false,
    "atHome" BOOLEAN NOT NULL DEFAULT false,
    "age" INTEGER,
    "eyeColor" TEXT,
    "skinColor" TEXT,
    "hairColor" TEXT,
    "hairType" TEXT,
    "heightCm" INTEGER,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "officeId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advisor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Advisor_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Advisor" ("approved", "createdAt", "id", "name", "officeId", "presentation", "presentationStatus", "updatedAt", "userId") SELECT "approved", "createdAt", "id", "name", "officeId", "presentation", "presentationStatus", "updatedAt", "userId" FROM "Advisor";
DROP TABLE "Advisor";
ALTER TABLE "new_Advisor" RENAME TO "Advisor";
CREATE UNIQUE INDEX "Advisor_userId_key" ON "Advisor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_name_key" ON "ServiceCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategoryDuration_categoryId_minutes_key" ON "ServiceCategoryDuration"("categoryId", "minutes");

-- CreateIndex
CREATE UNIQUE INDEX "AdvisorServiceCategory_advisorId_categoryId_key" ON "AdvisorServiceCategory"("advisorId", "categoryId");
