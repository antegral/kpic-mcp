/**
 * KPIC API Tests
 *
 * 외부 약학정보원 API 를 실제로 호출하지 않도록 global.fetch 를 mock 처리한다.
 * 이렇게 하면 네트워크/외부 API 상태와 무관하게 결정적으로 동작을 검증할 수 있다.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { search_drugs_by_name, get_drug_detail_by_id } from '../kpic-api.js';
import { KPICApiError } from '../types.js';

const TEST_TOKEN = '1071470000TESTTOKEN00';

// 검색 결과 픽스처 (테스트가 확인하는 필드만 포함)
const SEARCH_FIXTURE = [
  {
    pack_img: '',
    drug_pic: 'https://common.health.kr/img/2013062800004.jpg',
    drug_name: '가스딘2mg',
    drug_enm: 'Gasdin Tab. 2mg',
    drug_code: '2013062800004',
    sunb_count: 1,
    list_sunb_name: 'Irsogladine Maleate 2mg',
    ingr_mg: 'Irsogladine Maleate 2mg',
    dosage: '1일 2회 경구투여한다.',
    effect: '위염, 위궤양',
  },
];

// 상세 정보 픽스처 (테스트가 확인하는 필드만 포함)
const DETAIL_FIXTURE = [
  {
    idx: 73363,
    drug_code: '2013062800004',
    drug_name: '가스딘2mg',
    drug_enm: 'Gasdin Tab. 2mg',
    effect: '위염, 위궤양',
    dosage: '1일 2회 경구투여한다.',
    caution: '이 약에 과민반응이 있는 환자',
    additives: '유당수화물',
    stmt: '실온보관',
  },
];

/**
 * 목 Response 헬퍼: 검색 페이지 HTML (CSRF 토큰 + 세션 쿠키 포함)
 */
function makeHtmlResponse(token: string | null): Response {
  const html =
    token === null
      ? '<html><head><title>약학정보원</title></head><body>no token</body></html>'
      : `<script>window.csrfToken = "${token}";</script>`;

  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    text: () => Promise.resolve(html),
    headers: {
      getSetCookie: () => ['ASPSESSIONIDTEST=abc123; path=/', 'NCPVPCLBTG=def456; path=/'],
    },
  } as unknown as Response;
}

/**
 * 목 Response 헬퍼: JSON 본문
 */
function makeJsonResponse(
  data: unknown,
  init: { ok?: boolean; status?: number; statusText?: string } = {},
): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? 'OK',
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
    headers: { getSetCookie: () => [] },
  } as unknown as Response;
}

const mockFetch = jest.fn<(url: string, init?: RequestInit) => Promise<Response>>();

/**
 * URL 패턴에 따라 목 응답을 라우팅한다. 각 엔드포인트는 개별적으로 override 가능.
 */
function installFetch(
  overrides: {
    token?: () => Promise<Response>;
    search?: () => Promise<Response>;
    detail?: () => Promise<Response>;
  } = {},
): void {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('search_total_result.asp')) {
      return (overrides.token ?? (() => Promise.resolve(makeHtmlResponse(TEST_TOKEN))))();
    }
    if (url.includes('ajax_commonSearch.asp')) {
      return (overrides.search ?? (() => Promise.resolve(makeJsonResponse(SEARCH_FIXTURE))))();
    }
    if (url.includes('ajax_result_drug2.asp')) {
      return (overrides.detail ?? (() => Promise.resolve(makeJsonResponse(DETAIL_FIXTURE))))();
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as unknown as typeof fetch;
  installFetch();
});

describe('KPIC API Functions', () => {
  describe('search_drugs_by_name', () => {
    it('should return drug search results for valid drug name (Korean)', async () => {
      const result = await search_drugs_by_name('가스딘');

      expect(result).toBeTruthy();

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      const firstDrug = parsed[0];
      expect(firstDrug).toHaveProperty('drug_name');
      expect(firstDrug).toHaveProperty('drug_code');
      expect(firstDrug).toHaveProperty('drug_enm');
      expect(firstDrug).toHaveProperty('effect');
      expect(firstDrug).toHaveProperty('dosage');
    });

    it('should return drug search results for valid drug name (English)', async () => {
      const result = await search_drugs_by_name('gasdin');

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should acquire a CSRF token then POST it to the search endpoint', async () => {
      await search_drugs_by_name('가스딘');

      // 1) 세션 페이지 GET → 2) 검색 POST, 총 2회 호출
      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [tokenUrl] = mockFetch.mock.calls[0];
      expect(tokenUrl).toContain('search_total_result.asp');

      const [searchUrl, searchInit] = mockFetch.mock.calls[1];
      expect(searchUrl).toContain('ajax_commonSearch.asp');
      expect(searchUrl).toContain(`csrf_token=${TEST_TOKEN}`);

      expect(searchInit?.method).toBe('POST');
      const headers = searchInit?.headers as Record<string, string>;
      expect(headers['x-csrf-token']).toBe(TEST_TOKEN);
      // 세션 페이지에서 받은 쿠키가 검색 요청에 전달되어야 한다
      expect(headers.cookie).toContain('ASPSESSIONIDTEST');
    });

    it('should throw error for empty drug name without making a request', async () => {
      await expect(search_drugs_by_name('')).rejects.toThrow(KPICApiError);
      await expect(search_drugs_by_name('   ')).rejects.toThrow(KPICApiError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return empty array for non-existent drug', async () => {
      installFetch({ search: () => Promise.resolve(makeJsonResponse([])) });

      const result = await search_drugs_by_name('xyznonexistentdrug123456');

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });

    it('should throw KPICApiError when the search endpoint rejects the method (405)', async () => {
      installFetch({
        search: () =>
          Promise.resolve(
            makeJsonResponse(
              { result: 'fail', message: 'POST only' },
              { ok: false, status: 405, statusText: 'Method Not Allowed' },
            ),
          ),
      });

      await expect(search_drugs_by_name('가스딘')).rejects.toMatchObject({
        name: 'KPICApiError',
        statusCode: 405,
      });
    });

    it('should throw KPICApiError when the CSRF token cannot be found', async () => {
      installFetch({ token: () => Promise.resolve(makeHtmlResponse(null)) });

      await expect(search_drugs_by_name('가스딘')).rejects.toThrow(KPICApiError);
    });

    it('should wrap network errors as KPICApiError', async () => {
      installFetch({ token: () => Promise.reject(new Error('connection refused')) });

      await expect(search_drugs_by_name('가스딘')).rejects.toThrow(/Network error/);
    });
  });

  describe('get_drug_detail_by_id', () => {
    it('should return drug detail for valid drug code via GET', async () => {
      const result = await get_drug_detail_by_id('2013062800004');

      expect(result).toBeTruthy();

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);

      const detail = parsed[0];
      expect(detail).toHaveProperty('drug_code', '2013062800004');
      expect(detail).toHaveProperty('drug_name');
      expect(detail).toHaveProperty('effect');
      expect(detail).toHaveProperty('dosage');
      expect(detail).toHaveProperty('caution');
      expect(detail).toHaveProperty('additives');
      expect(detail).toHaveProperty('stmt');

      // 상세 조회는 CSRF 없이 단일 GET 요청
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0];
      expect(init?.method).toBe('GET');
    });

    it('should throw error for empty drug code without making a request', async () => {
      await expect(get_drug_detail_by_id('')).rejects.toThrow(KPICApiError);
      await expect(get_drug_detail_by_id('   ')).rejects.toThrow(KPICApiError);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should throw error for invalid drug code (empty result)', async () => {
      installFetch({ detail: () => Promise.resolve(makeJsonResponse([])) });

      await expect(get_drug_detail_by_id('invalid_code_12345')).rejects.toThrow(KPICApiError);
    });

    it('should throw KPICApiError on HTTP error (404)', async () => {
      installFetch({
        detail: () =>
          Promise.resolve(makeJsonResponse('', { ok: false, status: 404, statusText: 'Not Found' })),
      });

      await expect(get_drug_detail_by_id('2013062800004')).rejects.toMatchObject({
        name: 'KPICApiError',
        statusCode: 404,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle KPICApiError correctly', () => {
      const error = new KPICApiError('Test error', 404, 'Not found');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(KPICApiError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error.response).toBe('Not found');
      expect(error.name).toBe('KPICApiError');
    });
  });

  describe('Integration Test', () => {
    it('should perform complete workflow: search -> get detail', async () => {
      // 1. 약품 검색
      const searchResult = await search_drugs_by_name('가스딘');
      const searchParsed = JSON.parse(searchResult);

      expect(searchParsed.length).toBeGreaterThan(0);

      // 2. 첫 번째 결과의 상세 정보 조회
      const firstDrug = searchParsed[0];
      const detailResult = await get_drug_detail_by_id(firstDrug.drug_code);
      const detailParsed = JSON.parse(detailResult);

      expect(detailParsed.length).toBeGreaterThan(0);

      // 3. 상세 정보가 검색 결과와 일치하는지 확인
      const detail = detailParsed[0];
      expect(detail.drug_code).toBe(firstDrug.drug_code);
      expect(detail.drug_name).toBe(firstDrug.drug_name);
    });
  });
});
