# KPIC MCP Server

약학정보원(Korea Pharmaceutical Information Center) API를 위한 Model Context Protocol (MCP) 서버입니다.

## 기능

이 MCP 서버는 약학정보원의 의약품 정보를 조회할 수 있는 두 가지 도구를 제공합니다:

### 1. `search_drugs_by_name`

의약품 이름으로 대략적인 정보를 검색합니다.

**파라미터:**
- `drugname` (string): 검색할 의약품의 이름 (영문 또는 한글)

**반환값:**
- 검색된 의약품 목록 (JSON 배열)
- 각 항목에는 약품명, 제조사, 효능, 용법용량 등의 기본 정보 포함

### 2. `get_drug_detail_by_id`

의약품 코드로 상세 정보를 조회합니다.

**파라미터:**
- `drugcode` (string): 의약품 코드 (`search_drugs_by_name`의 결과에서 획득)

**반환값:**
- 의약품의 상세 정보 (JSON 배열)
- 포함 정보: 성분, 첨가제, 보관방법, 주의사항, 임부/수유부 정보 등

## 설치

```bash
pnpm install
```

## 빌드

```bash
pnpm build
```

## 실행

```bash
pnpm start
```

## 개발 모드

```bash
pnpm dev
```

## 테스트

```bash
pnpm test
```

## MCP 클라이언트 설정

Claude Desktop 또는 다른 MCP 클라이언트에서 이 서버를 사용하려면, 설정 파일에 다음을 추가하세요:

```json
{
  "mcpServers": {
    "kpic": {
      "command": "node",
      "args": ["/path/to/kpic-mcp/dist/index.js"]
    }
  }
}
```

## 프로젝트 구조

```
kpic-mcp/
├── src/
│   ├── index.ts          # MCP 서버 메인 엔트리포인트
│   ├── kpic-api.ts       # KPIC API 클라이언트 함수
│   └── types.ts          # TypeScript 타입 정의
├── __tests__/
│   └── kpic-api.test.ts  # 테스트 코드
├── dist/                 # 빌드 결과물 (TypeScript 컴파일 후)
├── package.json
├── tsconfig.json
└── README.md
```

## 사용 예시

### 의약품 검색

```typescript
// 타이레놀 검색
search_drugs_by_name("타이레놀")
```

### 상세 정보 조회

```typescript
// 특정 의약품 코드로 상세 정보 조회
get_drug_detail_by_id("2013062800004")
```

## 기술 스택

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.x
- **Framework**: MCP SDK (@modelcontextprotocol/sdk)
- **HTTP Client**: Native Fetch API
- **Testing**: Jest + ts-jest
- **Code Quality**: ESLint, Prettier
- **Package Manager**: pnpm

## 라이선스

MIT

## 주의사항

이 서버는 [약학정보원](https://www.health.kr)의 공개 API를 사용합니다. 
API 사용 시 해당 사이트의 이용 약관을 준수해야 합니다.

