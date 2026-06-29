/**
 * Google Drive ユーティリティ
 * GitHub Actions から Google Drive を操作するための共通関数
 */
const { google } = require('googleapis');

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
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
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
    supportsAllDrives: true,
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
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return res.data.files.length > 0;
}

async function createSpreadsheet(drive, parentId, name, headerRow) {
  if (await fileExists(drive, name, parentId)) {
    console.log(`⏭  スキップ（既存）: ${name}`);
    return null;
  }
  // 空のSpreadsheetを作成（CSVアップロードなし＝SA容量を使わない）
  const res = await drive.files.create({
    requestBody: {
      name,
      parents: [parentId],
      mimeType: 'application/vnd.google-apps.spreadsheet',
    },
    supportsAllDrives: true,
    fields: 'id, name',
  });
  const fileId = res.data.id;
  console.log(`✅ シート作成: ${name} (${fileId})`);

  // Sheets APIでヘッダー行を書き込む
  try {
    const saJson = process.env.GOOGLE_SA_JSON;
    const credentials = JSON.parse(saJson);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    await sheets.spreadsheets.values.update({
      spreadsheetId: fileId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: { values: [headerRow.split(',')] },
    });
    console.log(`📝 ヘッダー書き込み完了: ${name}`);
  } catch (e) {
    console.warn(`⚠️  ヘッダー書き込み失敗（後で手動設定可）: ${e.message}`);
  }

  return fileId;
}

async function createDoc(drive, parentId, name) {
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
    supportsAllDrives: true,
    fields: 'id, name',
  });
  console.log(`✅ ドキュメント作成: ${name} (${res.data.id})`);
  return res.data.id;
}

async function getOrCreateMonthFolder(drive, year, month) {
  // ルートから段階的にナビゲート（サービスアカウントは直接共有フォルダのみ files.get 可能なため）
  const ekeieiId = await findOrCreateFolder(drive, '07_経営企画室', FOLDER_IDS.root);
  const monthlyId = await findOrCreateFolder(drive, '📅 月次管理', ekeieiId);
  const yearFolderId = await findOrCreateFolder(drive, `${year}年`, monthlyId);
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
