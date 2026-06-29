/**
 * 月初ルーティン（毎月1日 09:00 JST 自動実行）
 * 担当: 経営企画室 月次管理チーム
 *
 * 実行内容:
 * 1. 当月フォルダを確認・作成
 * 2. 売上・入金管理シートを作成
 * 3. 支出・経費管理シートを作成
 */
const {
  getJSTDate,
  getDriveClient,
  createSpreadsheet,
  getOrCreateMonthFolder,
} = require('./drive-utils');

async function main() {
  const { year, month, label } = getJSTDate();
  console.log(`\n🏢 株式会社Riraly 月初ルーティン開始: ${label}`);
  console.log('━'.repeat(50));

  const drive = getDriveClient();

  // 診断: サービスアカウントのメールアドレスを表示
  try {
    const saJson = process.env.GOOGLE_SA_JSON;
    const creds = JSON.parse(saJson);
    console.log(`🔑 サービスアカウント: ${creds.client_email}`);
  } catch (e) {
    console.log('🔑 サービスアカウントメール取得失敗');
  }

  // 診断: 月次管理フォルダへのアクセステスト
  try {
    const { FOLDER_IDS } = require('./drive-utils');
    const meta = await drive.files.get({
      fileId: FOLDER_IDS.monthly,
      fields: 'id, name',
      supportsAllDrives: true,
    });
    console.log(`✅ フォルダアクセスOK: ${meta.data.name} (${meta.data.id})`);
  } catch (e) {
    console.error(`❌ フォルダアクセスNG: ${e.message}`);
    console.error(`   → Google Driveの「📅 月次管理」フォルダをサービスアカウントに共有してください`);
    console.error(`   → 上記🔑のメールアドレスに「編集者」権限で共有`);
    throw e;
  }

  // 当月フォルダを取得または作成
  const monthFolderId = await getOrCreateMonthFolder(drive, year, month);

  // 売上・入金管理シート
  await createSpreadsheet(
    drive,
    monthFolderId,
    `【売上・入金管理】${label}`,
    '月,顧客名,サービス種別,請求額,請求日,入金日,入金状態,備考'
  );

  // 支出・経費管理シート
  await createSpreadsheet(
    drive,
    monthFolderId,
    `【支出・経費管理】${label}`,
    '日付,カテゴリ,金額,支払先,内容,備考'
  );

  console.log('━'.repeat(50));
  console.log(`✅ ${label} 月初ルーティン完了`);
  console.log('📝 次のアクション: Google Drive でデータを入力してください');
}

main().catch((err) => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
