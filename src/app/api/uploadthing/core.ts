import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .onUploadComplete(async ({ file }) => {
      console.log("Upload complete");
      console.log("file url", file.url);
    }),
  importFile: f({ 
    "text/csv": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .onUploadComplete(async ({ file }) => {
      console.log("Import file upload complete");
      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

