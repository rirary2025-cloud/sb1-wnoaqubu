/**
 * 月中ルーティン（毎月15日 09:00 JST 自動実行）
 * 担当: デジタルマーケティング部
 *
 * 実行内容:
 * 1. SNS進捗レポートドキュメントを当月フォルダに作成
 */
const {
  getJSTDate,
  getDriveClient,
  createDoc,
  getOrCreateMonthFolder,
} = require('./drive-utils');

function buildSNSReportContent(label, year, month) {
  return `SNS月次進捗レポート　${label}
株式会社Riraly　デジタルマーケティング部
作成日: ${year}年${month}月15日

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 1. フォロワー数・友達数の推移
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【X（旧Twitter）】
  今月末: 　　　人　先月比: +　　人

【Instagram】
  今月末: 　　　人　先月比: +　　人

【TikTok】
  今月末: 　　　人　先月比: +　　人

【LINE公式】
  友達数: 　　　人　先月比: +　　人

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 2. 投稿実績
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【X（旧Twitter）】
  投稿数: 　件　リーチ: 　　　　インプレッション:

【Instagram】
  投稿数: 　件（フィード:　/ リール:　/ ストーリー:　）
  リーチ: 　　　　インプレッション:

【TikTok】
  投稿数: 　件　再生数合計:

【LINE公式】
  配信数: 　回　開封率: 　%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 3. エンゲージメント
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【X】いいね: 　　　RT: 　　　返信:
【Instagram】いいね: 　　　保存: 　　　コメント:
【TikTok】いいね: 　　　コメント: 　　　シェア:
【LINE】クリック数:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 4. 競合・業界リサーチ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【競合動向】


【業界トレンド】


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 5. 翌月の運用方針・提案事項
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【継続施策】


【改善提案】


【新規施策案】


`;
}

async function main() {
  const { year, month, label } = getJSTDate();
  console.log(`\n🏢 株式会社Riraly 月中ルーティン開始: ${label}`);
  console.log('━'.repeat(50));

  const drive = getDriveClient();

  const monthFolderId = await getOrCreateMonthFolder(drive, year, month);

  const content = buildSNSReportContent(label, year, month);
  await createDoc(
    drive,
    monthFolderId,
    `【SNS進捗レポート】${label}`,
    content
  );

  console.log('━'.repeat(50));
  console.log(`✅ ${label} 月中ルーティン完了`);
  console.log('📝 次のアクション: SNS進捗レポートに数値を入力してください');
}

main().catch((err) => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
