/**
 * backend/config/storage.js
 *
 * Storage Abstraction Layer – SkillSphere
 * ========================================
 * This module is the ONLY place in the codebase that deals with file storage.
 * All other modules call the exported helpers and remain unaware of the
 * underlying storage backend.
 *
 * Supported drivers (STORAGE_DRIVER env variable):
 *   • "local"      – active default, stores files on disk inside /backend/uploads
 *   • "azure-blob" – NOT IMPLEMENTED YET (see Azure placeholder comments below)
 *
 * To migrate to Azure Blob Storage in the future:
 *   1. Set  STORAGE_DRIVER=azure-blob  in your environment.
 *   2. Install "@azure/storage-blob".
 *   3. Fill in the Azure Blob implementation blocks marked with
 *      "AZURE BLOB IMPLEMENTATION" comments below.
 *   4. No other file in the project needs to change.
 */

"use strict";

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ─────────────────────────────────────────────
// Driver selection
// ─────────────────────────────────────────────
const STORAGE_DRIVER = (
  process.env.STORAGE_DRIVER || "local"
).toLowerCase();

// ─────────────────────────────────────────────
// Local storage – base uploads directory
// Resolved relative to the backend project root.
// ─────────────────────────────────────────────
const UPLOADS_DIR = path.resolve(
  process.env.UPLOADS_DIR || path.join(__dirname, "..", "uploads")
);

// Automatically create the uploads directory if it does not exist.
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log(`[Storage] Created uploads directory → ${UPLOADS_DIR}`);
}

// ═════════════════════════════════════════════
//  LOCAL STORAGE IMPLEMENTATION
// ═════════════════════════════════════════════

/**
 * Build a Multer diskStorage engine that writes files to UPLOADS_DIR.
 * File names are prefixed with a timestamp to avoid collisions.
 *
 * @returns {import("multer").StorageEngine}
 *
 * ─── AZURE BLOB IMPLEMENTATION ──────────────────────────────────────────────
 * Replace the diskStorage engine with multer-azure-blob-storage or a custom
 * StorageEngine that streams to Azure Blob Storage:
 *
 *   const { BlobServiceClient } = require("@azure/storage-blob");
 *   // build a multer StorageEngine that uses BlobServiceClient to upload
 *   // the incoming file stream to AZURE_STORAGE_CONTAINER.
 *   //
 *   // Required env vars:
 *   //   AZURE_STORAGE_CONNECTION_STRING  – Not implemented yet
 *   //   AZURE_STORAGE_CONTAINER          – Not implemented yet
 * ────────────────────────────────────────────────────────────────────────────
 */
function _buildLocalStorage() {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename(_req, file, cb) {
      // e.g.  1720000000000-profile-photo.png
      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      cb(null, `${Date.now()}-${safeName}`);
    },
  });
}

// ─────────────────────────────────────────────
//  AZURE BLOB IMPLEMENTATION PLACEHOLDER
// ─────────────────────────────────────────────
// function _buildAzureBlobStorage() {
//   /**
//    * ╔══════════════════════════════════════════════════════════╗
//    * ║  AZURE BLOB IMPLEMENTATION – Not implemented yet         ║
//    * ║                                                          ║
//    * ║  Install: npm install @azure/storage-blob                ║
//    * ║                                                          ║
//    * ║  Required env vars:                                      ║
//    * ║    AZURE_STORAGE_CONNECTION_STRING – connection string   ║
//    * ║    AZURE_STORAGE_CONTAINER         – container name      ║
//    * ╚══════════════════════════════════════════════════════════╝
//    *
//    * const { BlobServiceClient } = require("@azure/storage-blob");
//    * const blobServiceClient = BlobServiceClient.fromConnectionString(
//    *   process.env.AZURE_STORAGE_CONNECTION_STRING
//    * );
//    * const containerClient = blobServiceClient.getContainerClient(
//    *   process.env.AZURE_STORAGE_CONTAINER
//    * );
//    *
//    * // Return a custom multer StorageEngine here.
//    */
// }

// ═════════════════════════════════════════════
//  PUBLIC API – driver-agnostic helpers
// ═════════════════════════════════════════════

/**
 * Return a configured Multer middleware instance ready to be used in routes.
 *
 * Accepted MIME types: images and common video formats.
 * Max file size: 10 MB (configurable via options).
 *
 * @param {object} [options]
 * @param {number} [options.maxSizeMB=10]           – Maximum file size in MB.
 * @param {string[]} [options.allowedMimeTypes]      – Allowed MIME types.
 * @returns {import("multer").Multer}
 *
 * ─── AZURE BLOB IMPLEMENTATION ──────────────────────────────────────────────
 * Swap `_buildLocalStorage()` with `_buildAzureBlobStorage()`.
 * ────────────────────────────────────────────────────────────────────────────
 */
function getUploadMiddleware(options = {}) {
  const {
    maxSizeMB = 10,
    allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
    ],
  } = options;

  // ── LOCAL implementation ──────────────────────────────────────────────────
  const storage = _buildLocalStorage();

  // ─── AZURE BLOB IMPLEMENTATION ────────────────────────────────────────────
  // const storage = _buildAzureBlobStorage();   // Not implemented yet
  // ──────────────────────────────────────────────────────────────────────────

  return multer({
    storage,
    limits: { fileSize: maxSizeMB * 1024 * 1024 },
    fileFilter(_req, file, cb) {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            `File type "${file.mimetype}" is not allowed. ` +
              `Accepted types: ${allowedMimeTypes.join(", ")}`
          )
        );
      }
    },
  });
}

/**
 * Resolve the public URL for an uploaded file, given its stored filename.
 *
 * @param {string} filename – The filename as stored (e.g. Multer's file.filename).
 * @returns {string}
 *
 * ─── AZURE BLOB IMPLEMENTATION ──────────────────────────────────────────────
 * Replace the local URL template with:
 *   return `https://<account>.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER}/${filename}`;
 * ────────────────────────────────────────────────────────────────────────────
 */
function fileUrl(filename) {
  if (!filename) return null;

  // ── LOCAL implementation ──────────────────────────────────────────────────
  const baseUrl = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.replace(/\/$/, "")
    : `http://localhost:${process.env.PORT || 5000}`;
  return `${baseUrl}/uploads/${filename}`;

  // ─── AZURE BLOB IMPLEMENTATION ────────────────────────────────────────────
  // return `https://<account>.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER}/${filename}`;
  // ──────────────────────────────────────────────────────────────────────────
}

/**
 * Delete a stored file by its filename.
 * Resolves silently (no error) if the file does not exist.
 *
 * @param {string} filename
 * @returns {boolean} true if the file was deleted, false if it did not exist.
 *
 * ─── AZURE BLOB IMPLEMENTATION ──────────────────────────────────────────────
 * Replace the local unlink with:
 *   const containerClient = ...;
 *   const blobClient = containerClient.getBlobClient(filename);
 *   const result = await blobClient.deleteIfExists();
 *   return result.succeeded;
 * ────────────────────────────────────────────────────────────────────────────
 */
function deleteFile(filename) {
  if (!filename) return false;

  // ── LOCAL implementation ──────────────────────────────────────────────────
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;

  // ─── AZURE BLOB IMPLEMENTATION ────────────────────────────────────────────
  // const containerClient = ...;
  // const blobClient = containerClient.getBlobClient(filename);
  // const result = await blobClient.deleteIfExists();   // Not implemented yet
  // return result.succeeded;
  // ──────────────────────────────────────────────────────────────────────────
}

/**
 * Programmatically save a file buffer to storage (non-Multer path).
 * Useful for server-generated files or data exports.
 *
 * @param {Buffer|string} data     – File content.
 * @param {string}        filename – Desired filename (will be sanitised).
 * @returns {string} The saved filename (may differ from input after sanitisation).
 *
 * ─── AZURE BLOB IMPLEMENTATION ──────────────────────────────────────────────
 * Replace the writeFileSync with:
 *   const containerClient = ...;
 *   const blockBlobClient = containerClient.getBlockBlobClient(safeFilename);
 *   await blockBlobClient.upload(data, Buffer.byteLength(data));
 *   return safeFilename;
 * ────────────────────────────────────────────────────────────────────────────
 */
function saveFile(data, filename) {
  const safeFilename = `${Date.now()}-${filename.replace(
    /[^a-zA-Z0-9.\-_]/g,
    "_"
  )}`;

  // ── LOCAL implementation ──────────────────────────────────────────────────
  const filePath = path.join(UPLOADS_DIR, safeFilename);
  fs.writeFileSync(filePath, data);
  return safeFilename;

  // ─── AZURE BLOB IMPLEMENTATION ────────────────────────────────────────────
  // const containerClient = ...;
  // const blockBlobClient = containerClient.getBlockBlobClient(safeFilename);
  // await blockBlobClient.upload(data, Buffer.byteLength(data));  // Not implemented yet
  // return safeFilename;
  // ──────────────────────────────────────────────────────────────────────────
}

/**
 * Verify that the storage backend is accessible.
 * Used by health-check endpoints and startup routines.
 *
 * @returns {{ ok: boolean, driver: string, error?: string }}
 *
 * ─── AZURE BLOB IMPLEMENTATION ──────────────────────────────────────────────
 * Replace the local check with:
 *   const containerClient = ...;
 *   const exists = await containerClient.exists();
 *   return { ok: exists, driver: STORAGE_DRIVER };
 * ────────────────────────────────────────────────────────────────────────────
 */
function healthCheck() {
  try {
    // ── LOCAL implementation ──────────────────────────────────────────────
    fs.accessSync(UPLOADS_DIR, fs.constants.W_OK);
    return { ok: true, driver: STORAGE_DRIVER, uploadsDir: UPLOADS_DIR };

    // ─── AZURE BLOB IMPLEMENTATION ────────────────────────────────────────
    // const containerClient = ...;
    // const exists = await containerClient.exists();   // Not implemented yet
    // return { ok: exists, driver: STORAGE_DRIVER };
    // ──────────────────────────────────────────────────────────────────────
  } catch (err) {
    return { ok: false, driver: STORAGE_DRIVER, error: err.message };
  }
}

// ─────────────────────────────────────────────
//  Boot-time driver validation
// ─────────────────────────────────────────────
const SUPPORTED_DRIVERS = ["local"]; // add "azure-blob" here once implemented
if (!SUPPORTED_DRIVERS.includes(STORAGE_DRIVER)) {
  throw new Error(
    `[Storage] Unsupported STORAGE_DRIVER="${STORAGE_DRIVER}". ` +
      `Supported: ${SUPPORTED_DRIVERS.join(", ")}`
  );
}

module.exports = {
  getUploadMiddleware,
  fileUrl,
  deleteFile,
  saveFile,
  healthCheck,
};
