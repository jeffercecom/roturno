-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Office" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "isOpenDaily" BOOLEAN NOT NULL DEFAULT true,
    "dailyOpening" BOOLEAN NOT NULL DEFAULT true,
    "openToday" BOOLEAN NOT NULL DEFAULT true,
    "continuous24Hours" BOOLEAN NOT NULL DEFAULT false,
    "openingTime" TEXT NOT NULL DEFAULT '00:00',
    "closingTime" TEXT NOT NULL DEFAULT '23:59',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Office" ("address", "continuous24Hours", "createdAt", "dailyOpening", "id", "isOpenDaily", "name", "openToday", "updatedAt") SELECT "address", "continuous24Hours", "createdAt", "dailyOpening", "id", "isOpenDaily", "name", "openToday", "updatedAt" FROM "Office";
DROP TABLE "Office";
ALTER TABLE "new_Office" RENAME TO "Office";
CREATE UNIQUE INDEX "Office_name_key" ON "Office"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
