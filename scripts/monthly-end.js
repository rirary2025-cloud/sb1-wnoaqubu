/**
 * 月末ルーティン（毎月25日 09:00 JST 自動実行）
 * 担当: 経理・財務課
 *
 * 実行内容:
 * 1. 経理月次レポートを当月フォルダに作成
 * 2. 6月（決算月）は年間サマリーセクションも追加
 */
const {
  getJSTDate,
  getDriveClient,
  createDoc,
  getOrCreateMonthFolder,
} = require('./drive-utils');

function isDecisionMonth(month) {
  return month === '06';
}

function buildAccountingReportContent(label, year, month) {
  const isDecision = isDecisionMonth(month);
  const fiscalPeriod = parseInt(month) <= 6 ? 2 : 3; // 第2期終了後なので第3期〜調整が必要

  let content = `経理月次レポート　${label}
株式会社Riraly　経営管理部 経理・財務課
作成日: ${year}年${month}月25日
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 売上サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  売上合計:　　　　　　　　　円
  入金済み:　　　　　　　　　円
  未入金（請求中）:　　　　　円

■ 売上内訳（サービス別）
  SNS運用代行:　　　　　　　円
  コンテンツ制作:　　　　　　円
  広告運用:　　　　　　　　　円
  その他:　　　　　　　　　　円

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 経費内訳（カテゴリ別）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  広告費:　　　　　　　　　　円
  外注費:　　　　　　　　　　円
  通信費:　　　　　　　　　　円
  交通費:　　　　　　　　　　円
  消耗品費:　　　　　　　　　円
  その他:　　　　　　　　　　円
  ─────────────────────
  経費合計:　　　　　　　　　円

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 損益サマリー
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  粗利:　　　　　　　　　　　円
  粗利率:　　　　　　　　　　%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 当月トピック
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 翌月の予定・注意事項
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


`;

  if (isDecision) {
    content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■【決算月】年間サマリー（${year}年度 第${fiscalPeriod - 1}期）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  【年間売上合計】　　　　　　円
  【年間経費合計】　　　　　　円
  【年間粗利】　　　　　　　　円
  【年間粗利率】　　　　　　　%

  月別売上推移:
  7月:　円　8月:　円　9月:　円
  10月:　円　11月:　円　12月:　円
  1月:　円　2月:　円　3月:　円
  4月:　円　5月:　円　6月:　円

  【来期に向けた課題・戦略】


`;
  }

  content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
※ このレポートをPDF化してコンサルへ送付してください
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return content;
}

async function main() {
  const { year, month, label } = getJSTDate();
  console.log(`\n🏢 株式会社Riraly 月末ルーティン開始: ${label}`);
  console.log('━'.repeat(50));

  if (isDecisionMonth(month)) {
    console.log('🎯 決算月（6月）: 年間サマリーセクションを追加します');
  }

  const drive = getDriveClient();

  const monthFolderId = await getOrCreateMonthFolder(drive, year, month);

  const reportName = isDecisionMonth(month)
    ? `【経理月次レポート】${label}（決算）`
    : `【経理月次レポート】${label}`;

  const content = buildAccountingReportContent(label, year, month);
  await createDoc(drive, monthFolderId, reportName, content);

  console.log('━'.repeat(50));
  console.log(`✅ ${label} 月末ルーティン完了`);
  console.log('📧 次のアクション: 数値入力 → PDF化 → コンサルへ送付');
}

main().catch((err) => {
  console.error('❌ エラー:', err.message);
  process.exit(1);
});
