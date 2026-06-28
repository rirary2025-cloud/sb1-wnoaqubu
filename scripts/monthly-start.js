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
