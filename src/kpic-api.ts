/**
 * KPIC (Korea Pharmaceutical Information Center) API Client
 */

import { DrugSearchResult, DrugDetailResult, KPICApiError } from './types.js';

/**
 * 약학정보원 API 호스트.
 *
 * `www.health.kr` 는 `health.kr` 로 301 리다이렉트되는데, fetch 는 이를 교차 출처
 * 이동으로 간주해 Cookie 헤더를 제거한다. 검색 API 는 세션 쿠키를 요구하므로
 * 리다이렉트가 없는 non-www 호스트로 직접 호출한다.
 */
const BASE_URL = 'https://health.kr';

interface SearchSession {
  csrfToken: string;
  cookie: string;
}

/**
 * 응답의 Set-Cookie 헤더들에서 `name=value` 쌍만 추출하여 Cookie 헤더 문자열로 만든다.
 */
function extractCookieHeader(response: Response): string {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : [];
  return setCookies
    .map((cookie) => cookie.split(';')[0].trim())
    .filter(Boolean)
    .join('; ');
}

/**
 * 검색 페이지를 먼저 호출하여 세션 쿠키와 CSRF 토큰을 획득한다.
 *
 * 약학정보원 검색 API 가 POST + CSRF 토큰을 요구하도록 변경되어, 검색 요청 전에
 * 유효한 세션을 만들어 두어야 한다.
 *
 * @returns 세션 쿠키와 CSRF 토큰
 * @throws {KPICApiError} 페이지 요청 실패 또는 토큰을 찾지 못한 경우
 */
async function fetchSearchSession(): Promise<SearchSession> {
  const response = await fetch(`${BASE_URL}/searchDrug/search_total_result.asp`, {
    method: 'GET',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'ko,en-US;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new KPICApiError(
      `Failed to initialize search session: ${response.statusText}`,
      response.status,
    );
  }

  const cookie = extractCookieHeader(response);
  const html = await response.text();

  // 페이지에 `window.csrfToken = "..."` 형태로 토큰이 삽입된다.
  // (HTML 주석 `<!-- PAGE CSRF_TOKEN=... -->` 을 예비로 사용)
  const match =
    html.match(/window\.csrfToken\s*=\s*["']([^"']+)["']/) ??
    html.match(/CSRF_TOKEN=([A-Za-z0-9]+)/);

  if (!match) {
    throw new KPICApiError('Failed to obtain CSRF token from KPIC search page');
  }

  return { csrfToken: match[1], cookie };
}

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

  try {
    // 1. 세션 쿠키 + CSRF 토큰 획득
    const { csrfToken, cookie } = await fetchSearchSession();

    // 2. POST 로 검색 요청 (CSRF 토큰을 쿼리/헤더/바디에 함께 전달)
    const now = Date.now();
    const query = new URLSearchParams({
      search_word: drugname,
      csrf_token: csrfToken,
      search_flag: 'all',
      _: String(now),
    });
    const url = `${BASE_URL}/searchDrug/ajax/ajax_commonSearch.asp?${query.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ru;q=0.7',
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'x-requested-with': 'XMLHttpRequest',
        'x-csrf-token': csrfToken,
        cookie,
        Referer: `${BASE_URL}/searchDrug/search_total_result.asp`,
      },
      body: new URLSearchParams({ csrf_token: csrfToken }).toString(),
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
  const query = new URLSearchParams({ drug_cd: drugcode, _: String(now) });
  const url = `${BASE_URL}/searchDrug/ajax/ajax_result_drug2.asp?${query.toString()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/javascript, */*; q=0.01',
        'accept-language': 'ko,en-US;q=0.9,en;q=0.8,ru;q=0.7',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        Referer: `${BASE_URL}/searchDrug/result_drug.asp?drug_cd=${encodeURIComponent(drugcode)}`,
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
