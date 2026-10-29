# BPA & Screaming Frog API Server Contract for CTO Jonie Iordache
**Version**: 1.0.0-PROD  
**Author**: Bright Pink Agency Engineering & Technical SEO Architecture  
**Sponsor**: Jonie Iordache (CTO) & Víctor Henríquez (Senior Technical SEO Architect)  
**Target Platform**: BPA Technical Audit Hub (`bpa-audit-hub`) & Jonie's Automation Suite (`bright-audits.replit.app`)  
**Base URL**: `http://localhost:3000/api` (Local/Server) or `https://bpa-audit-hub.internal/api`  

---

### 1. Architectural Architecture & Topology
1. **Worker Layer (Screaming Frog Node)**:
   - Dedicated VM or local execution runner running licensed Screaming Frog SEO Spider (v24.0+).
   - Two operational modes supported:
     - **Mode A (CLI Headless Worker)**: Invoked via shell execution of `ScreamingFrogSEOSpiderCli.exe` with structured output directed to a shared export volume (`data/crawls/<crawl_id>/`).
     - **Mode B (Streamable HTTP / MCP Server)**: Direct communication with Screaming Frog's internal SSE/HTTP server on `http://127.0.0.1:11435/mcp`.
2. **Ingestion & Aggregation Layer (BPA Audit Hub Backend)**:
   - Node.js + Express backend (`server/index.js`).
   - Modular routes mounted at `/api/crawler` (`server/routes/crawler.js`) and crawler service (`server/services/screaming-frog.js`).
   - Crawl ingestion pipeline (`server/ingestion/crawl-pipeline.js`) consuming raw crawl exports (`internal_all.csv`, `issues_overview.csv`, `issues_reports/*.csv`, and `*_inlinks.csv`).
   - Computes calibrated true health scores, isolates Cloudflare WAF false positives (`wafFalsePositive403`), synthesizes 4-part technical task payloads (Root Cause, Impact, Code, Arch), and updates client stores (`data/clients/<slug>.json`).
3. **Executive Presentation Layer (Audit Hub UI)**:
   - Real-time client cards, retainer sprint progress, 4-part task modals, dynamic crawl depth charts, and Replit 1:1 Schema Bridge.

---

### 2. Authentication & Headers
- All crawler management and ingestion endpoints support agency authentication headers:
  `x-bpa-auth: Bearer <API_TOKEN>` or `x-sync-secret: <SYNC_SECRET>` or `Authorization: Bearer <API_TOKEN>`.
- Content-Type: `application/json` (or `multipart/form-data` for direct file upload).

---

### 3. API Endpoints Specification

#### Endpoint 1: Initiate Crawl
- **Route**: `POST /api/crawler/crawl`
- **Description**: Triggers a new headless spider crawl for a client domain.
- **Request Headers**:
  `x-bpa-auth: Bearer <TOKEN>` (optional in local dev)  
  `Content-Type: application/json`
- **Request Body Schema**:
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["clientSlug", "targetUrl"],
  "properties": {
    "clientSlug": { "type": "string", "example": "oh-deer" },
    "targetUrl": { "type": "string", "format": "uri", "example": "https://oh-deer.com" },
    "crawlMode": { "type": "string", "enum": ["spider", "list", "sitemap"], "default": "spider" },
    "options": {
      "type": "object",
      "properties": {
        "maxCrawlDepth": { "type": "integer", "default": 10 },
        "limitUrls": { "type": "integer", "default": 10000 },
        "respectRobots": { "type": "boolean", "default": true },
        "exportReports": {
          "type": "array",
          "items": { "type": "string" },
          "default": ["Crawl Overview", "Issues Overview", "Redirects:Redirect Chains"]
        },
        "bulkExports": {
          "type": "array",
          "items": { "type": "string" },
          "default": [
            "Issues:All",
            "Response Codes:Internal:Internal Client Error (4xx) Inlinks",
            "Response Codes:Internal:Internal Redirection (3xx) Inlinks",
            "Links:All Inlinks"
          ]
        },
        "exportFormat": { "type": "string", "enum": ["csv", "xlsx"], "default": "csv" },
        "configFile": { "type": "string", "description": "Path or preset name of .seospiderconfig" }
      }
    }
  }
}
```
- **Response (202 Accepted)**:
```json
{
  "success": true,
  "crawlId": "crawl_ohdeer_20261029_061500",
  "clientSlug": "oh-deer",
  "targetUrl": "https://oh-deer.com",
  "status": "queued",
  "startedAt": "2026-10-29T06:15:00.000Z",
  "statusUrl": "/api/crawler/crawls/crawl_ohdeer_20261029_061500/status"
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid target URL, missing client slug, or invalid options format.
  - `409 Conflict`: Crawl already in progress for this client slug.
  - `503 Service Unavailable`: Crawler backend service not available.

---

#### Endpoint 2: Crawl Status & Progress Monitoring
- **Route**: `GET /api/crawler/crawls/:crawlId/status`
- **Description**: Returns live progress percentage, crawled URL counts, and current state.
- **Response (200 OK) — While Running**:
```json
{
  "crawlId": "crawl_ohdeer_20261029_061500",
  "clientSlug": "oh-deer",
  "status": "running",
  "progressPercentage": 64.5,
  "metrics": {
    "urlsCrawled": 3670,
    "urlsEnqueued": 5692,
    "currentUrl": "https://oh-deer.com/locations/cape-cod/",
    "elapsedSeconds": 142,
    "estimatedRemainingSeconds": 78
  },
  "flags": {
    "paused": false,
    "hasErrors": false
  }
}
```
- **Response (200 OK) — When Completed**:
```json
{
  "crawlId": "crawl_ohdeer_20261029_061500",
  "clientSlug": "oh-deer",
  "status": "completed",
  "progressPercentage": 100.0,
  "completedAt": "2026-10-29T06:18:32.000Z",
  "totalCrawled": 5692,
  "exportFolder": "data/crawls/crawl_ohdeer_20261029_061500",
  "availableExports": [
    "internal_all.csv",
    "crawl_overview.csv",
    "issues_overview.csv",
    "issues_reports/client_error_4xx.csv",
    "issues_reports/redirection_3xx.csv",
    "inlinks/client_error_4xx_inlinks.csv",
    "inlinks/redirection_3xx_inlinks.csv"
  ]
}
```
- **Error Responses**:
  - `404 Not Found`: Crawl ID not recognized.

---

#### Endpoint 3: Crawl Control (Pause, Resume, Cancel)
- **Routes**:
  - `POST /api/crawler/crawls/:crawlId/pause`
  - `POST /api/crawler/crawls/:crawlId/resume`
  - `POST /api/crawler/crawls/:crawlId/cancel`
- **Response (200 OK)**:
```json
{
  "crawlId": "crawl_ohdeer_20261029_061500",
  "action": "pause",
  "currentStatus": "paused"
}
```
- **Error Responses**:
  - `400 Bad Request`: Cannot pause/resume in current status (e.g. already completed).
  - `404 Not Found`: Crawl ID not recognized.

---

#### Endpoint 4: Export Inspection & Issues Extraction
- **Route**: `GET /api/crawler/crawls/:crawlId/issues`
- **Query Params**:
  - `type` (`issue`, `warning`, `opportunity`, `all` — default: `all`)
  - `minUrls` (integer, e.g. `minUrls=5` — default: `0`)
- **Response (200 OK)**:
```json
{
  "crawlId": "crawl_ohdeer_20261029_061500",
  "totalIssuesCount": 18,
  "issues": [
    {
      "id": "RESPONSE_CODES_3XX",
      "issueName": "Redirection (3xx) Internal",
      "issueType": "Warning",
      "urlsAffected": 245,
      "percentOfTotal": 4.3,
      "inlinksCount": 364,
      "csvReport": "issues_reports/redirection_3xx.csv",
      "inlinksReport": "inlinks/redirection_3xx_inlinks.csv"
    },
    {
      "id": "PAGE_TITLES_DUPLICATE_PAGINATION",
      "issueName": "Page Titles: Duplicate",
      "issueType": "Warning",
      "urlsAffected": 14,
      "percentOfTotal": 0.25,
      "csvReport": "issues_reports/page_titles_duplicate.csv"
    }
  ]
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid `type` or `minUrls` parameter.
  - `404 Not Found`: Crawl ID not recognized.

---

#### Endpoint 5: Inlinks Extraction & Graph Analysis
- **Route**: `GET /api/crawler/crawls/:crawlId/inlinks`
- **Query Params**:
  - `targetStatusCode` (e.g. `301`, `404`, `403`)
  - `limit` (integer, default: 100, max: 1000)
  - `groupBy` (`template` | `source` | `target` — default: `template`)
- **Response (200 OK)**:
```json
{
  "crawlId": "crawl_ohdeer_20261029_061500",
  "filter": { "targetStatusCode": 301 },
  "totalInlinks": 245,
  "topRootCauses": [
    {
      "originType": "Global Navigation / Footer Menu",
      "detectedPattern": "Trailing slash omission in theme footer location queries",
      "affectedInlinksCount": 218,
      "samplePairs": [
        {
          "source": "https://oh-deer.com/",
          "destination": "https://oh-deer.com/cape-cod",
          "anchor": "Cape Cod Location",
          "linkPath": "footer > div.location-links > a:nth-child(2)"
        }
      ]
    }
  ]
}
```
- **Error Responses**:
  - `400 Bad Request`: Invalid status code or limit format.
  - `404 Not Found`: Crawl ID not recognized.

---

#### Endpoint 6: List Recent Crawls
- **Route**: `GET /api/crawler/crawls`
- **Query Params**:
  - `clientSlug` (optional string)
  - `status` (`queued` | `running` | `paused` | `completed` | `cancelled` | `failed`)
  - `limit` (integer, default: 50)
- **Response (200 OK)**:
```json
{
  "total": 1,
  "crawls": [
    {
      "crawlId": "crawl_ohdeer_20261029_061500",
      "clientSlug": "oh-deer",
      "targetUrl": "https://oh-deer.com",
      "status": "completed",
      "startedAt": "2026-10-29T06:15:00.000Z",
      "completedAt": "2026-10-29T06:18:32.000Z",
      "progressPercentage": 100.0,
      "totalCrawled": 5692
    }
  ]
}
```

---

#### Endpoint 7: Ingest Crawl Data into Client Store (M2 Pipeline)
- **Route**: `POST /api/clients/:slug/ingest/crawl`
- **Description**: Automated atomic pipeline that reads the crawl export directory, runs `bpa_audit_core.py` logic, recalibrates health scores, synthesizes 4-part tasks, and updates `data/clients/:slug.json`.
- **Request Body**:
```json
{
  "crawlId": "crawl_ohdeer_20261029_061500",
  "crawlExportPath": "data/crawls/crawl_ohdeer_20261029_061500",
  "options": {
    "recalibrateHealth": true,
    "generateSprintTasks": true,
    "preserveCompletedTasks": true
  }
}
```
- **Response (200 OK)**:
```json
{
  "success": true,
  "clientSlug": "oh-deer",
  "updatedKpis": {
    "totalCrawledUrls": 5692,
    "clean200HtmlPages": 945,
    "internal301Redirects": 245,
    "broken404Pages": 0,
    "wafFalsePositive403": 818,
    "calibratedTrueHealth": 92
  },
  "tasksGenerated": 3,
  "completedTasksPreserved": 5
}
```

---

### 4. Exact Data Contracts for Screaming Frog Exports

#### 4.1 `issues_overview.csv` Schema
| Column Name | Data Type | Nullable | Example / Values | Description |
|---|---|---|---|---|
| `Issue` | String | No | `"Page Titles: Missing"` | Categorical issue identifier |
| `Issue Type` | String | No | `"Issue"`, `"Warning"`, `"Opportunity"` | Screaming Frog severity |
| `Issue Description` | String | Yes | `"The page title element is missing..."` | Plain English description |
| `Number of URLs` | Integer | No | `14` | Total affected target URLs |
| `% of Total` | Float | No | `0.25` | Percentage of total crawled scope |

#### 4.2 Individual Issue CSV Schema (under `issues_reports/*.csv`)
Example: `client_error_4xx.csv` / `redirection_3xx.csv`
| Column Name | English Candidate | Spanish Candidate | Data Type | Notes |
|---|---|---|---|---|
| `Address` | `Address` / `URL` | `Dirección` / `URL` | URI String | Normalized full absolute URL |
| `Status Code` | `Status Code` | `Código de respuesta` | Integer | 200, 301, 302, 403, 404, 500 |
| `Status` | `Status` | `Respuesta` | String | `Moved Permanently`, `Not Found` |
| `Inlinks` | `Inlinks` | `Enlaces internos` | Integer | Total internal hyperlinks pointing here |
| `Unique Inlinks` | `Unique Inlinks` | `Enlaces internos únicos`| Integer | Distinct source pages linking |
| `Redirect URL` | `Redirect URL` | `URL de redirección` | URI String | Target destination (for 3xx) |
| `Redirect Type` | `Redirect Type` | `Tipo de redirección` | String | `HTTP Redirect`, `JavaScript Redirect` |

#### 4.3 Inlinks CSV Schema (`*_inlinks.csv`)
Example: `client_error_4xx_inlinks.csv`, `redirection_3xx_inlinks.csv`, `all_inlinks.csv`
| Column Name | Data Type | Nullable | Example Values | Purpose in BPA Pipeline |
|---|---|---|---|---|
| `Type` | String | No | `"Hyperlink"`, `"Canonical"`, `"Image"` | Filters link medium |
| `Source` | URI String | No | `"https://oh-deer.com/blog/"` | Page hosting the link |
| `Destination` | URI String | No | `"https://oh-deer.com/cape-cod"` | Target URL returning error/301 |
| `Anchor` | String | Yes | `"Cape Cod Mosquito Control"` | Anchor text for CMS search |
| `Alt Text` | String | Yes | `""` or `"Logo image"` | Image alternative text if applicable |
| `Status Code` | Integer | No | `301`, `404` | Destination HTTP response |
| `Status` | String | No | `"Moved Permanently"` | Destination HTTP status text |
| `Follow` | Boolean | No | `true`, `false` | Distinguishes followed links |
| `Target` | String | Yes | `"_blank"`, `"_self"` | DOM target attribute |
| `Rel` | String | Yes | `"nofollow"`, `"noopener"` | Relationship attribute |
| `Path Type` | String | No | `"Absolute"`, `"Root-Relative"` | Critical for detecting relative path errors |
| `Link Path` | String | Yes | `"html > body > footer > div > a"` | Exact DOM locator for developer fix |
| `Link Origin` | String | Yes | `"Navigation"`, `"Content"` | Architectural classification |

---

### 5. Agency Guardrails & Ground Truth Compliance (`GEMINI.md`)
1. **Rule 2 & Rule 7 (Zero-Assumption WAF & Status Codes)**: Semrush and Screaming Frog 403s on WP Engine / Cloudflare must be categorized into `wafFalsePositive403` and verified in live requests before counting them as errors.
2. **Rule 8 (Canonical Master Workbook)**: Ingestion maps directly to the 5 canonical workbook tabs.
3. **Rule 14 & Rule 25 (Developer Bridge Standard)**: Automatically synthesized tasks must strictly follow the 4-part structure:
   - `Symptom & Live Evidence`
   - `Root Cause Analysis`
   - `Ready-to-Test Code`
   - `Architectural Recommendation`
4. **Rule 27 (Zero-Fabrication Policy)**: No synthetic, simulated, or hallucinated health metrics are permitted. If a metric cannot be derived directly from raw crawl data, it must default to `null`.
