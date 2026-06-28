/**
 * Google Drive ユーティリティ
 * GitHub Actions から Google Drive を操作するための共通関数
 */
const { google } = require('googleapis');
const { Readable } = require('stream');

// 株式会社Riraly Google Drive フォルダID定数
const FOLDER_IDS = {
  root: '1NwN63YGGx5ni1JmSXNCCKQZylfRjIp4V',
  monthly: '1qQvD_OvkgTrVF0l25dAwb4j8TqAik100',  // 📅 月次管理
  year2025: '1TdAPp02JjAsmJvby_9dXYoPCyJX6AoOv',
  year2026: '1Z4T-m-661LPUeoIeTl-MgOW47ex82glh',
  templates: '1dYaizl7myZpZ_jxl5E53az-_sKycPM9Z',  // 📄 テンプレート
  jimoko: '11S7gm-Vv-Q6bVvJq-7sHxzBURC3lfqU8',     // 🗺️ ジモコ
};

function getJSTDate() {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: jst.getFullYear(),
    month: String(jst.getMonth() + 1).padStart(2, '0'),
    day: String(jst.getDate()).padStart(2, '0'),
    yearStr: `${jst.getFullYear()}年`,
    monthStr: `${String(jst.getMonth() + 1).padStart(2, '0')}月`,
    label: `${jst.getFullYear()}年${String(jst.getMonth() + 1).padStart(2, '0')}月`,
  };
}

function getYearFolderId(year) {
  if (year === 2025) return FOLDER_IDS.year2025;
  if (year === 2026) return FOLDER_IDS.year2026;
  // 2027年以降は月次管理直下に都度作成
  return null;
}

function getDriveClient() {
  const saJson = process.env.GOOGLE_SA_JSON;
  if (!saJson) throw new Error('GOOGLE_SA_JSON environment variable is not set');

  const credentials = JSON.parse(saJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
}

async function findFolder(drive, name, parentId) {
  const escaped = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${escaped}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  return res.data.files[0] || null;
}

async function findOrCreateFolder(drive, name, parentId) {
  const existing = await findFolder(drive, name, parentId);
  if (existing) {
    console.log(`📁 既存フォルダ: ${name} (${existing.id})`);
    return existing.id;
  }
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id, name',
  });
  console.log(`📁 フォルダ作成: ${name} (${res.data.id})`);
  return res.data.id;
}

async function fileExists(drive, name, parentId) {
  const escaped = name.replace(/'/g, "\\'");
  const res = await drive.files.list({
    q: `name='${escaped}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  return res.data.files.length > 0;
}

async function createSpreadsheet(drive, parentId, name, headerRow) {
  if (await fileExists(drive, name, parentId)) {
    console.log(`⏭  スキップ（既存）: ${name}`);
    return null;
  }
  const csvContent = headerRow + '\n';
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.spreadsheet',
    },
    media: {
      mimeType: 'text/csv',
      body: Readable.from([csvContent]),
    },
    fields: 'id, name',
  });
  console.log(`✅ シート作成: ${name} (${res.data.id})`);
  return res.data.id;
}

async function createDoc(drive, parentId, name, content) {
  if (await fileExists(drive, name, parentId)) {
    console.log(`⏭  スキップ（既存）: ${name}`);
    return null;
  }
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.document',
    },
    media: {
      mimeType: 'text/plain',
      body: Readable.from([Buffer.from(content, 'utf-8')]),
    },
    fields: 'id, name',
  });
  console.log(`✅ ドキュメント作成: ${name} (${res.data.id})`);
  return res.data.id;
}

async function getOrCreateMonthFolder(drive, year, month) {
  let yearFolderId = getYearFolderId(year);

  if (!yearFolderId) {
    yearFolderId = await findOrCreateFolder(drive, `${year}年`, FOLDER_IDS.monthly);
  }

  const monthFolderId = await findOrCreateFolder(drive, `${month}月`, yearFolderId);
  return monthFolderId;
}

module.exports = {
  FOLDER_IDS,
  getJSTDate,
  getDriveClient,
  findOrCreateFolder,
  fileExists,
  createSpreadsheet,
  createDoc,
  getOrCreateMonthFolder,
};
