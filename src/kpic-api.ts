/**
 * KPIC (Korea Pharmaceutical Information Center) API Client
 */

import { DrugSearchResult, DrugDetailResult, KPICApiError } from './types.js';

/**
 * 약학정보원에서 의약품 이름으로 대략적인 정보들을 가져온다.
 * 이름이 유사한 의약품 여러개가 나올 수 있다.
 *
 * @param drugname 검색할 의약품의 이름 (영문 또는 한글)
 * @returns JSON 문자열 형태의 검색 결과
 * @throws {KPICApiError} API 요청 실패 시
 */
export async function search_drugs_by_name(drugname: string): Promise<string> {
  if (!drugname || drugname.trim().length === 0) {
    throw new KPICApiError('Drug name cannot be empty');
  }

  const now = Date.now();
  const url = `https://www.health.kr/searchDrug/ajax/ajax_commonSearch.asp?search_word=${encodeURIComponent(drugname)}&search_flag=all&_=${now}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ru;q=0.7',
        'x-requested-with': 'XMLHttpRequest',
        Referer: 'https://www.health.kr/searchDrug/search_total_result.asp',
      },
    });

    if (!response.ok) {
      throw new KPICApiError(`API request failed: ${response.statusText}`, response.status);
    }

    const data = await response.text();

    // 응답 데이터 검증
    try {
      const parsed = JSON.parse(data) as DrugSearchResult[];

      if (!Array.isArray(parsed)) {
        throw new KPICApiError('Invalid response format: expected array');
      }

      // 결과를 보기 좋게 포맷팅하여 반환
      return JSON.stringify(parsed, null, 2);
    } catch (parseError) {
      if (parseError instanceof KPICApiError) {
        throw parseError;
      }
      throw new KPICApiError(
        `Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      );
    }
  } catch (error) {
    if (error instanceof KPICApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new KPICApiError(`Network error: ${error.message}`);
    }

    throw new KPICApiError('Unknown error occurred');
  }
}

/**
 * 약학정보원의 의약품 코드로 의약품의 상세정보를 가져온다.
 * search_drugs_by_name()로 조회한 정보가 부족할 때 사용할 수 있다.
 *
 * @param drugcode search_drugs_by_name()의 결과 값에 기재된 의약품의 drug_code 값
 * @returns JSON 문자열 형태의 상세 정보
 * @throws {KPICApiError} API 요청 실패 시
 */
export async function get_drug_detail_by_id(drugcode: string): Promise<string> {
  if (!drugcode || drugcode.trim().length === 0) {
    throw new KPICApiError('Drug code cannot be empty');
  }

  const now = Date.now();
  const url = `https://www.health.kr/searchDrug/ajax/ajax_result_drug2.asp?drug_cd=${encodeURIComponent(drugcode)}&_=${now}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ru;q=0.7',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        Referer: `https://www.health.kr/searchDrug/result_drug.asp?drug_cd=${encodeURIComponent(drugcode)}`,
      },
    });

    if (!response.ok) {
      throw new KPICApiError(`API request failed: ${response.statusText}`, response.status);
    }

    const data = await response.text();

    // 응답 데이터 검증
    try {
      const parsed = JSON.parse(data) as DrugDetailResult[];

      if (!Array.isArray(parsed)) {
        throw new KPICApiError('Invalid response format: expected array');
      }

      if (parsed.length === 0) {
        throw new KPICApiError(`No drug found with code: ${drugcode}`);
      }

      // 결과를 보기 좋게 포맷팅하여 반환
      return JSON.stringify(parsed, null, 2);
    } catch (parseError) {
      if (parseError instanceof KPICApiError) {
        throw parseError;
      }
      throw new KPICApiError(
        `Failed to parse API response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      );
    }
  } catch (error) {
    if (error instanceof KPICApiError) {
      throw error;
    }

    if (error instanceof Error) {
      throw new KPICApiError(`Network error: ${error.message}`);
    }

    throw new KPICApiError('Unknown error occurred');
  }
}
