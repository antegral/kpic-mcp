#!/usr/bin/env node

/**
 * KPIC MCP Server
 * Model Context Protocol server for Korea Pharmaceutical Information Center API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { search_drugs_by_name, get_drug_detail_by_id } from './kpic-api.js';
import { KPICApiError } from './types.js';

/**
 * MCP 도구 정의
 */
const TOOLS: Tool[] = [
  {
    name: 'search_drugs_by_name',
    description:
      '약학정보원에서 의약품 이름으로 대략적인 정보들을 가져옵니다. ' +
      '이름이 유사한 의약품 여러개가 나올 수 있습니다. ' +
      '더 자세한 정보가 필요하다면 get_drug_detail_by_id()로 조회해야 합니다.',
    inputSchema: {
      type: 'object',
      properties: {
        drugname: {
          type: 'string',
          description: '검색할 의약품의 이름 (영문 또는 한글)',
        },
      },
      required: ['drugname'],
    },
  },
  {
    name: 'get_drug_detail_by_id',
    description:
      '약학정보원의 의약품 코드로 의약품의 상세정보를 가져옵니다. ' +
      'search_drugs_by_name()로 조회한 정보가 부족할 때 사용할 수 있습니다.',
    inputSchema: {
      type: 'object',
      properties: {
        drugcode: {
          type: 'string',
          description: 'search_drugs_by_name()의 결과 값에 기재된 의약품의 drug_code 값',
        },
      },
      required: ['drugcode'],
    },
  },
];

/**
 * MCP 서버 생성 및 초기화
 */
async function main() {
  const server = new Server(
    {
      name: 'kpic-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  /**
   * 도구 목록 반환 핸들러
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOLS,
    };
  });

  /**
   * 도구 실행 핸들러
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'search_drugs_by_name': {
          const { drugname } = args as { drugname: string };
          
          if (!drugname) {
            throw new Error('drugname parameter is required');
          }

          const result = await search_drugs_by_name(drugname);
          
          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        case 'get_drug_detail_by_id': {
          const { drugcode } = args as { drugcode: string };
          
          if (!drugcode) {
            throw new Error('drugcode parameter is required');
          }

          const result = await get_drug_detail_by_id(drugcode);
          
          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      if (error instanceof KPICApiError) {
        return {
          content: [
            {
              type: 'text',
              text: `KPIC API Error: ${error.message}${error.statusCode ? ` (Status: ${error.statusCode})` : ''}`,
            },
          ],
          isError: true,
        };
      }

      if (error instanceof Error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: 'Unknown error occurred',
          },
        ],
        isError: true,
      };
    }
  });

  /**
   * 서버 시작
   */
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('KPIC MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

