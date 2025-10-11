# GitHub Actions Workflows

이 디렉토리에는 프로젝트의 CI/CD 파이프라인 설정이 포함되어 있습니다.

## 워크플로우 목록

### 1. CI (`ci.yml`)
- **트리거**: `main`, `develop` 브랜치에 push 또는 PR 생성 시
- **실행 내용**:
  - Node.js 18.x, 20.x 버전에서 매트릭스 테스트
  - 코드 린팅 (`pnpm lint`)
  - TypeScript 타입 체크 (`tsc --noEmit`)
  - 테스트 실행 (`pnpm test`)
  - 프로젝트 빌드 (`pnpm build`)
  - 빌드 아티팩트 업로드 (Node.js 20.x에서만)

### 2. Release (`release.yml`)
- **트리거**: `v*.*.*` 형식의 태그 push 시 (예: `v1.0.0`)
- **실행 내용**:
  - 전체 CI 프로세스 실행
  - GitHub Release 생성
  - 빌드된 파일들을 Release에 첨부
  - 릴리즈 노트 자동 생성

**릴리즈 생성 방법**:
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 3. CodeQL (`codeql.yml`)
- **트리거**:
  - `main` 브랜치에 push 시
  - `main` 브랜치로의 PR 생성 시
  - 매주 월요일 자동 실행 (스케줄)
- **실행 내용**:
  - GitHub의 CodeQL을 사용한 보안 취약점 분석
  - JavaScript/TypeScript 코드 정적 분석

## Dependabot (`../dependabot.yml`)

의존성을 자동으로 최신 상태로 유지하기 위한 설정입니다.

- **GitHub Actions**: 매주 자동 업데이트
- **npm 패키지**: 매주 자동 업데이트 (메이저 버전 제외)
- 자동으로 PR 생성하여 업데이트 제안

## 상태 배지 (Status Badges)

README.md에 다음 배지를 추가할 수 있습니다:

```markdown
![CI](https://github.com/[사용자명]/agent-for-agent/workflows/CI/badge.svg)
![CodeQL](https://github.com/[사용자명]/agent-for-agent/workflows/CodeQL/badge.svg)
```

## 참고사항

- pnpm 8.15.0을 사용합니다
- Node.js 18.0.0 이상이 필요합니다
- 모든 워크플로우는 `pnpm install --frozen-lockfile`을 사용하여 정확한 버전의 의존성을 설치합니다

