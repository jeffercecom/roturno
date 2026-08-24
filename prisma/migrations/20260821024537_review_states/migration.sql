-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdvisorSpeciality" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "specialityId" TEXT NOT NULL,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "activeByAdvisor" BOOLEAN NOT NULL DEFAULT true,
    "hiddenByOwner" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "AdvisorSpeciality_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AdvisorSpeciality_specialityId_fkey" FOREIGN KEY ("specialityId") REFERENCES "Speciality" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdvisorSpeciality" ("advisorId", "id", "specialityId") SELECT "advisorId", "id", "specialityId" FROM "AdvisorSpeciality";
DROP TABLE "AdvisorSpeciality";
ALTER TABLE "new_AdvisorSpeciality" RENAME TO "AdvisorSpeciality";
CREATE UNIQUE INDEX "AdvisorSpeciality_advisorId_specialityId_key" ON "AdvisorSpeciality"("advisorId", "specialityId");
CREATE TABLE "new_Photo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "advisorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'IMAGE',
    "isFace" BOOLEAN NOT NULL DEFAULT false,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Photo_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "Advisor" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Photo" ("advisorId", "approved", "createdAt", "id", "isFace", "isMain", "mediaType", "url") SELECT "advisorId", "approved", "createdAt", "id", "isFace", "isMain", "mediaType", "url" FROM "Photo";
DROP TABLE "Photo";
ALTER TABLE "new_Photo" RENAME TO "Photo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
