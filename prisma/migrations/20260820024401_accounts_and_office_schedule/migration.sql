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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Office" ("address", "createdAt", "id", "name", "updatedAt") SELECT "address", "createdAt", "id", "name", "updatedAt" FROM "Office";
DROP TABLE "Office";
ALTER TABLE "new_Office" RENAME TO "Office";
CREATE UNIQUE INDEX "Office_name_key" ON "Office"("name");
CREATE TABLE "new_OfficeAdmin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "officeId" TEXT NOT NULL,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "substitute" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "OfficeAdmin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfficeAdmin_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OfficeAdmin" ("id", "officeId", "userId") SELECT "id", "officeId", "userId" FROM "OfficeAdmin";
DROP TABLE "OfficeAdmin";
ALTER TABLE "new_OfficeAdmin" RENAME TO "OfficeAdmin";
CREATE UNIQUE INDEX "OfficeAdmin_userId_key" ON "OfficeAdmin"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT,
    "email" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'ADVISOR',
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "role", "updatedAt") SELECT "createdAt", "email", "id", "password", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
