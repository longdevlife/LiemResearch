/**
 * OpenAPI 3.0 spec for the Publication Trend API. Served as interactive,
 * testable docs at GET /api-docs (Swagger UI). Hand-maintained for now;
 * keep it in sync when adding/changing endpoints.
 */
export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Publication Trend API",
    version: "0.1.0 (Phase A)",
    description:
      "AI-assisted academic publication trend system. Phase A exposes auth, " +
      "paper search/detail, and admin sync. Every response uses the envelope " +
      "`{ success, data, meta? }` or `{ success: false, error }`.",
  },
  servers: [{ url: "http://localhost:4000", description: "Local dev" }],
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Papers" },
    { name: "Search" },
    { name: "Trends" },
    { name: "Admin" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "NOT_FOUND" },
              message: { type: "string", example: "Paper not found" },
              details: {},
            },
          },
        },
      },
      Meta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          pageSize: { type: "integer", example: 20 },
          total: { type: "integer", example: 200 },
          totalPages: { type: "integer", example: 10 },
        },
      },
      PaperAuthor: {
        type: "object",
        properties: {
          displayName: { type: "string", example: "Enkelejda Kasneci" },
          position: { type: "integer", example: 0 },
          isCorresponding: { type: "boolean", example: true },
        },
      },
      Paper: {
        type: "object",
        properties: {
          id: { type: "string", example: "6a1a6e79b89cd7e3196fdc98" },
          title: {
            type: "string",
            example:
              "ChatGPT for good? On opportunities and challenges of large language models for education",
          },
          abstractText: { type: "string" },
          authors: { type: "array", items: { $ref: "#/components/schemas/PaperAuthor" } },
          journalName: { type: "string", example: "Learning and Individual Differences" },
          publicationYear: { type: "integer", example: 2023 },
          citationCount: { type: "integer", example: 4826 },
          topics: {
            type: "array",
            items: {
              type: "object",
              properties: { topicName: { type: "string" }, confidence: { type: "number" } },
            },
          },
          externalIds: {
            type: "object",
            properties: {
              doi: { type: "string", example: "10.1016/j.lindif.2023.102274" },
              openalexId: { type: "string", example: "W4321..." },
            },
          },
          openAccessStatus: {
            type: "string",
            enum: ["gold", "green", "hybrid", "bronze", "closed", "unknown"],
          },
          openAccessUrl: { type: "string" },
          dataQualityScore: { type: "number", example: 0.857 },
          isAiAnalyzable: { type: "boolean", example: true },
          dataStatus: { type: "string", enum: ["draft", "active", "low-quality", "archived"] },
          primaryProvider: { type: "string", example: "openalex" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      YearlyCount: {
        type: "object",
        properties: {
          year: { type: "integer", example: 2024 },
          count: { type: "integer", example: 87 },
        },
      },
      TopItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Computers and Education" },
          count: { type: "integer", example: 12 },
        },
      },
      TrendingTopic: {
        type: "object",
        properties: {
          topic: { type: "string", example: "Artificial Intelligence" },
          totalPapers: { type: "integer", example: 142 },
          yearlyBreakdown: { type: "array", items: { $ref: "#/components/schemas/YearlyCount" } },
          growthRatePct: { type: "number", example: 38.5, description: "YoY %, last complete year vs the one before" },
          cagr3yPct: { type: "number", nullable: true, example: 52.1, description: "Compound annual growth over <=3 complete years" },
          momentum: { type: "number", example: 21.4, description: "Least-squares slope, papers/year" },
        },
      },
      RisingKeyword: {
        type: "object",
        properties: {
          keyword: { type: "string", example: "retrieval-augmented generation" },
          totalPapers: { type: "integer", example: 9 },
          growthRatePct: { type: "number", example: 350 },
          yearlyBreakdown: { type: "array", items: { $ref: "#/components/schemas/YearlyCount" } },
        },
      },
      TrendsOverview: {
        type: "object",
        properties: {
          yearFrom: { type: "integer", example: 2021 },
          yearTo: { type: "integer", example: 2026 },
          lastCompleteYear: {
            type: "integer",
            example: 2025,
            description:
              "Metrics use years <= this. yearlyBreakdown entries beyond it are the running YTD year — label/style them accordingly on charts.",
          },
          totalPapersInWindow: { type: "integer", example: 594 },
          topics: { type: "array", items: { $ref: "#/components/schemas/TrendingTopic" } },
          risingKeywords: { type: "array", items: { $ref: "#/components/schemas/RisingKeyword" } },
          computedAt: { type: "string", format: "date-time" },
        },
      },
      PublicationTrend: {
        type: "object",
        properties: {
          topic: { type: "string", example: "Artificial Intelligence" },
          totalPapers: { type: "integer", example: 142 },
          yearlyBreakdown: { type: "array", items: { $ref: "#/components/schemas/YearlyCount" } },
          lastCompleteYear: {
            type: "integer",
            example: 2025,
            description: "Same semantics as TrendsOverview.lastCompleteYear",
          },
          growthRatePct: { type: "number", example: 38.5 },
          cagr3yPct: { type: "number", nullable: true, example: 52.1 },
          momentum: { type: "number", example: 21.4 },
          topJournals: { type: "array", items: { $ref: "#/components/schemas/TopItem" } },
          topAuthors: { type: "array", items: { $ref: "#/components/schemas/TopItem" } },
          topKeywords: { type: "array", items: { $ref: "#/components/schemas/TopItem" } },
          computedAt: { type: "string", format: "date-time" },
        },
      },
      AuthCredentials: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "researcher@university.edu" },
          password: { type: "string", format: "password", example: "password123" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Create an account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/AuthCredentials" },
                  {
                    type: "object",
                    required: ["fullName"],
                    properties: {
                      fullName: { type: "string", example: "Hoang Long Anh" },
                      role: { type: "string", enum: ["student", "lecturer", "researcher"] },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: { "201": { description: "Created — returns { user, tokens }" } },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/AuthCredentials" } },
          },
        },
        responses: {
          "200": { description: "OK — returns { user, tokens }" },
          "401": {
            description: "Invalid credentials",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
          },
        },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK — returns { user }" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/v1/papers": {
      get: {
        tags: ["Papers"],
        summary: "Search + list papers (paginated)",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" }, description: "Keyword over title + abstract" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
        ],
        responses: {
          "200": {
            description: "List of papers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "array", items: { $ref: "#/components/schemas/Paper" } },
                    meta: { $ref: "#/components/schemas/Meta" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/papers/{id}": {
      get: {
        tags: ["Papers"],
        summary: "Paper detail",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Single paper",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/Paper" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Not found",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
          },
        },
      },
    },
    "/api/v1/search": {
      get: {
        tags: ["Search"],
        summary: "Semantic search (Phase B) — match by meaning via vector embeddings",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string" }, description: "Natural-language query" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
          { name: "yearFrom", in: "query", schema: { type: "integer" } },
          { name: "yearTo", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Papers ranked by semantic similarity (each item has a `score` 0..1)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        allOf: [
                          { $ref: "#/components/schemas/Paper" },
                          { type: "object", properties: { score: { type: "number", example: 0.91 } } },
                        ],
                      },
                    },
                    meta: { $ref: "#/components/schemas/Meta" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/trends": {
      get: {
        tags: ["Trends"],
        summary: "Trending topics overview — yearly series + growth metrics + rising keywords",
        description:
          "Aggregates research_papers per topic per year, then computes growth metrics " +
          "over COMPLETE years (the running calendar year is charted but excluded from " +
          "the math). Formulas: YoY growth %, 3-year CAGR %, momentum (least-squares " +
          "slope, papers/year). Cached in Redis for 1h.",
        parameters: [
          { name: "yearFrom", in: "query", schema: { type: "integer" }, description: "Default: yearTo - 5" },
          { name: "yearTo", in: "query", schema: { type: "integer" }, description: "Default: current year" },
          { name: "limit", in: "query", schema: { type: "integer", default: 10, maximum: 50 } },
          { name: "minPapers", in: "query", schema: { type: "integer", default: 3 }, description: "Hide topics with fewer total papers (noise filter)" },
          { name: "sortBy", in: "query", schema: { type: "string", enum: ["momentum", "growth", "total"], default: "momentum" } },
        ],
        responses: {
          "200": {
            description: "Trends overview",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/TrendsOverview" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/trends/{topic}": {
      get: {
        tags: ["Trends"],
        summary: "Deep dive into one topic — series, metrics, top journals/authors/keywords",
        parameters: [
          { name: "topic", in: "path", required: true, schema: { type: "string" }, description: "Exact topic name (URL-encoded), e.g. 'Artificial Intelligence'" },
          { name: "yearFrom", in: "query", schema: { type: "integer" } },
          { name: "yearTo", in: "query", schema: { type: "integer" } },
        ],
        responses: {
          "200": {
            description: "Topic trend detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { $ref: "#/components/schemas/PublicationTrend" },
                  },
                },
              },
            },
          },
          "404": {
            description: "Topic has no papers in the window",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
          },
        },
      },
    },
    "/api/v1/admin/embed": {
      post: {
        tags: ["Admin"],
        summary: "Trigger an embedding run (enqueues a job)",
        security: [{ bearerAuth: [] }],
        responses: { "202": { description: "Queued — returns { jobId, status }" }, "403": { description: "Admin only" } },
      },
    },
    "/api/v1/admin/embed/status": {
      get: {
        tags: ["Admin"],
        summary: "Embedding coverage — how many analyzable papers have vectors",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "{ analyzable, embedded, pending }" } },
      },
    },
    "/api/v1/admin/sync": {
      post: {
        tags: ["Admin"],
        summary: "Trigger an OpenAlex sync (enqueues a job)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["searchText"],
                properties: {
                  searchText: { type: "string", example: "large language model education" },
                  yearFrom: { type: "integer", default: 2022 },
                  maxPages: { type: "integer", default: 1, maximum: 50 },
                },
              },
            },
          },
        },
        responses: { "202": { description: "Queued — returns { jobId, status }" }, "403": { description: "Admin only" } },
      },
    },
    "/api/v1/admin/sync/runs": {
      get: {
        tags: ["Admin"],
        summary: "List recent sync runs with stats",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Recent runs" }, "403": { description: "Admin only" } },
      },
    },
  },
} as const;
