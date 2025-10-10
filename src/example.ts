/**
 * KPIC API 사용 예제
 *
 * 이 파일은 독립적으로 실행 가능한 예제입니다.
 *
 * 실행 방법:
 * pnpm build && node dist/example.js
 */

import { search_drugs_by_name, get_drug_detail_by_id } from './kpic-api.js';

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('약학정보원 API 예제');
    console.log('='.repeat(80));
    console.log();

    // 1. 의약품 검색
    console.log('1. 의약품 검색: "타이레놀"');
    console.log('-'.repeat(80));
    const searchResult = await search_drugs_by_name('타이레놀');
    const drugs = JSON.parse(searchResult);

    console.log(`검색 결과: ${drugs.length}개의 의약품을 찾았습니다.`);
    console.log();

    if (drugs.length > 0) {
      const firstDrug = drugs[0];
      console.log(`첫 번째 결과:`);
      console.log(`  - 약품명: ${firstDrug.drug_name}`);
      console.log(`  - 영문명: ${firstDrug.drug_enm}`);
      console.log(`  - 약품코드: ${firstDrug.drug_code}`);
      console.log(`  - 제조사: ${firstDrug.upso_name_kfda}`);
      console.log(`  - 제형: ${firstDrug.drug_form}`);
      console.log(`  - 보험가: ${firstDrug.boh_price}`);
      console.log();

      // 2. 상세 정보 조회
      console.log('2. 상세 정보 조회');
      console.log('-'.repeat(80));
      const detailResult = await get_drug_detail_by_id(firstDrug.drug_code);
      const details = JSON.parse(detailResult);

      if (details.length > 0) {
        const detail = details[0];
        console.log(`약품명: ${detail.drug_name}`);
        console.log(`주성분: ${detail.list_sunb_name}`);
        console.log(`첨가제: ${detail.additives}`);
        console.log(`보관방법: ${detail.stmt}`);
        console.log(`성상: ${detail.charact_new}`);
        console.log();
        console.log(`효능/효과:`);
        console.log(detail.effect.substring(0, 200) + '...');
        console.log();
      }
    }

    console.log('='.repeat(80));
    console.log('예제 실행 완료!');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('에러 발생:', error);
    process.exit(1);
  }
}

main();
