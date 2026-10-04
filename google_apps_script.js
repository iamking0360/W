/**
 * ====================================================================
 * WAVELVADI VILLAGE PORTAL - GOOGLE APPS SCRIPT FOR GOOGLE DRIVE CLOUD
 * ====================================================================
 * Copy and paste this entire code into your Google Apps Script project.
 * URL: https://script.google.com
 * Deploy as: Web App -> Execute as: Me -> Who has access: Anyone
 */

// Google Drive Folder ID where creator and village files will be saved.
// Leave as '' to automatically save in root Google Drive.
// If you paste a full link or ID with /edit, it is automatically sanitized!
var DRIVE_FOLDER_ID = '1KS0zubCnL3t5AdpUhuk2jZU7qrxXsNH5GNvxYfGCu0Px-8OCXqgD6Osx';

// API Secret token for security (set in .env as GOOGLE_SCRIPT_SECRET).
var API_SECRET = 'z7R/7W7W5wK+CZUmNn4n/xUNNTzTDjl6az7S7WUm07E=';

// Helper to sanitize Google Drive folder IDs
function sanitizeFolderId(rawId) {
  if (!rawId || typeof rawId !== 'string') return '';
  var s = rawId.trim();
  if (!s || s === 'FOLDER_ID') return '';
  // Extract ID from full URL like https://drive.google.com/drive/folders/ABC
  var m = s.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  // Remove /edit, query parameters, trailing slashes
  s = s.replace(/\/edit.*$/i, '').replace(/\?.*$/i, '').replace(/\/+$/, '');
  var parts = s.split('/');
  return parts[parts.length - 1];
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    status: 'online',
    service: 'Wavelvadi Google Drive Cloud Storage Web App',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = {};

    // Support both JSON body and form-urlencoded parameters
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        data = e.parameter || {};
      }
    } else if (e.parameter) {
      data = e.parameter;
    }

    // Flexible API key / secret check
    var incomingKey = data.apiKey || data.secret || data.key || data.token ||
                      (e.parameter && (e.parameter.apiKey || e.parameter.secret || e.parameter.token || e.parameter.key)) || '';

    if (API_SECRET && API_SECRET.length > 0 && API_SECRET !== 'GOOGLE_SCRIPT_SECRET') {
      if (incomingKey !== API_SECRET) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Unauthorized'
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    var action = data.action || 'upload';

    // Ping / Test connection
    if (action === 'ping' || action === 'test') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Google Apps Script & Google Drive Storage connected successfully!',
        time: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // File upload action (Stores file directly in Google Drive cloud)
    if (action === 'upload') {
      var base64Data = data.fileData || data.data || data.file || data.base64;
      var fileName = data.fileName || data.filename || data.name || ('wavelvadi_' + new Date().getTime() + '.dat');
      var mimeType = data.mimeType || data.mimetype || data.type || 'application/octet-stream';

      if (!base64Data) {
        return ContentService.createTextOutput(JSON.stringify({
          success: false,
          error: 'Missing file information'
        })).setMimeType(ContentService.MimeType.JSON);
      }

      // Decode base64 to binary blob
      var decodedBytes = Utilities.base64Decode(base64Data);
      var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);

      // Select target folder (with bulletproof error handling & root fallback)
      var targetFolder = DriveApp.getRootFolder();
      var folderIdToUse = sanitizeFolderId(data.folderId || data.folder || DRIVE_FOLDER_ID);

      if (folderIdToUse && folderIdToUse.length > 0) {
        try {
          targetFolder = DriveApp.getFolderById(folderIdToUse);
        } catch (fErr) {
          // Fallback safely to root folder if folder ID not found or restricted
          targetFolder = DriveApp.getRootFolder();
        }
      }

      // Create file in Google Drive
      var file = targetFolder.createFile(blob);

      // Set public viewable permissions
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (shareErr) {
        // Fallback for domains restricting public sharing
      }

      var fileId = file.getId();
      var viewUrl = 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing';
      var downloadUrl = 'https://drive.google.com/uc?export=download&id=' + fileId;
      var directUrl = 'https://lh3.googleusercontent.com/d/' + fileId;
      var previewUrl = 'https://drive.google.com/file/d/' + fileId + '/preview';

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        fileId: fileId,
        fileName: fileName,
        viewUrl: viewUrl,
        downloadUrl: downloadUrl,
        directUrl: directUrl,
        previewUrl: previewUrl,
        message: 'File successfully uploaded and stored on Google Drive!'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: 'Unknown action: ' + action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
