-- CreateTable
CREATE TABLE "OfficeChangeRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "fromOfficeId" TEXT,
    "toOfficeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfficeChangeRequest_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfficeChangeRequest_fromOfficeId_fkey" FOREIGN KEY ("fromOfficeId") REFERENCES "Office" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfficeChangeRequest_toOfficeId_fkey" FOREIGN KEY ("toOfficeId") REFERENCES "Office" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OfficeChangeRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isFace" BOOLEAN NOT NULL DEFAULT false,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("advisorId", "createdAt", "id", "isFace", "isMain", "url") SELECT "advisorId", "createdAt", "id", "isFace", "isMain", "url" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
CREATE TABLE "new_Speciality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Speciality" ("id", "name") SELECT "id", "name" FROM "Speciality";
DROP TABLE "Speciality";
ALTER TABLE "new_Speciality" RENAME TO "Speciality";
CREATE UNIQUE INDEX "Speciality_name_key" ON "Speciality"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
