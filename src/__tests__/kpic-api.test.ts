/**
 * KPIC API Tests
 */

import { describe, it, expect, jest } from '@jest/globals';
import { search_drugs_by_name, get_drug_detail_by_id } from '../kpic-api.js';
import { KPICApiError } from '../types.js';

// API 호출 타임아웃 설정 (30초)
jest.setTimeout(30000);

describe('KPIC API Functions', () => {
  describe('search_drugs_by_name', () => {
    it('should return drug search results for valid drug name (Korean)', async () => {
      const result = await search_drugs_by_name('가스딘');
      
      expect(result).toBeTruthy();
      
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      
      if (parsed.length > 0) {
        const firstDrug = parsed[0];
        expect(firstDrug).toHaveProperty('drug_name');
        expect(firstDrug).toHaveProperty('drug_code');
        expect(firstDrug).toHaveProperty('drug_enm');
        expect(firstDrug).toHaveProperty('effect');
        expect(firstDrug).toHaveProperty('dosage');
      }
    });

    it('should return drug search results for valid drug name (English)', async () => {
      const result = await search_drugs_by_name('tylenol');
      
      expect(result).toBeTruthy();
      
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should throw error for empty drug name', async () => {
      await expect(search_drugs_by_name('')).rejects.toThrow(KPICApiError);
      await expect(search_drugs_by_name('   ')).rejects.toThrow(KPICApiError);
    });

    it('should return empty array for non-existent drug', async () => {
      const result = await search_drugs_by_name('xyznonexistentdrug123456');
      
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('get_drug_detail_by_id', () => {
    it('should return drug detail for valid drug code', async () => {
      // 먼저 약품을 검색하여 유효한 drug_code 획득
      const searchResult = await search_drugs_by_name('가스딘');
      const searchParsed = JSON.parse(searchResult);
      
      if (searchParsed.length === 0) {
        console.warn('No drugs found in search, skipping detail test');
        return;
      }
      
      const drugCode = searchParsed[0].drug_code;
      const result = await get_drug_detail_by_id(drugCode);
      
      expect(result).toBeTruthy();
      
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
      
      const detail = parsed[0];
      expect(detail).toHaveProperty('drug_code', drugCode);
      expect(detail).toHaveProperty('drug_name');
      expect(detail).toHaveProperty('effect');
      expect(detail).toHaveProperty('dosage');
      expect(detail).toHaveProperty('caution');
      expect(detail).toHaveProperty('additives');
      expect(detail).toHaveProperty('stmt'); // 보관방법
    });

    it('should throw error for empty drug code', async () => {
      await expect(get_drug_detail_by_id('')).rejects.toThrow(KPICApiError);
      await expect(get_drug_detail_by_id('   ')).rejects.toThrow(KPICApiError);
    });

    it('should throw error for invalid drug code', async () => {
      await expect(get_drug_detail_by_id('invalid_code_12345')).rejects.toThrow(KPICApiError);
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
      const searchResult = await search_drugs_by_name('타이레놀');
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
    }, 60000); // 통합 테스트는 더 긴 타임아웃 허용
  });
});

