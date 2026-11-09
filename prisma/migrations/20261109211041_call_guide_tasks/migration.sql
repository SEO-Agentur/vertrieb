-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "kind" TEXT NOT NULL DEFAULT 'TODO';

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
