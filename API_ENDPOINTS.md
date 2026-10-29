# Audit App — Screaming Frog API Endpoints & Data Schemas

### 1. Overview & Authentication
- All crawler management and ingestion endpoints use standard header authentication:
  `x-bpa-auth: Bearer <API_TOKEN>` or `Authorization: Bearer <API_TOKEN>`.
- Content-Type: `application/json` (or `multipart/form-data` for direct file upload).

---

### 2. API Endpoints Specification

#### Endpoint 1: Initiate Crawl
- **Route**: `POST /api/crawler/crawl`
- **Description**: Triggers a new headless spider crawl for a client domain.
- **Request Headers**:
  `Authorization: Bearer <TOKEN>`  
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
          "default": ["Crawl Overview", "Issues Overview", "Redirects:All Redirects"]
        },
        "bulkExports": {
          "type": "array",
          "items": { "type": "string" },
          "default": [
            "Issues:All",
            "Response Codes:Internal:Internal Client Error (4xx) Inlinks",
            "Response Codes:Internal:Internal Redirection (3xx) Inlinks"
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
  - `409 Conflict`: Crawl already in progress.
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
    "issues_overview_report.csv",
    "issues_reports/response_codes_internal_client_error_(4xx).csv",
    "issues_reports/response_codes_internal_client_error_(4xx)_inlinks.csv",
    "issues_reports/response_codes_internal_redirection_(3xx).csv",
    "issues_reports/response_codes_internal_redirection_(3xx)_inlinks.csv"
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
      "issueName": "Response Codes: Internal Redirection (3xx)",
      "issueType": "Warning",
      "urlsAffected": 245,
      "percentOfTotal": 4.3,
      "inlinksCount": 364,
      "csvReport": "issues_reports/response_codes_internal_redirection_(3xx).csv",
      "inlinksReport": "issues_reports/response_codes_internal_redirection_(3xx)_inlinks.csv"
    },
    {
      "id": "PAGE_TITLES_DUPLICATE",
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
          "linkPath": "//footer/div/a[2]",
          "linkPosition": "Footer"
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

#### Endpoint 7: Ingest Crawl Data into Client Store
- **Route**: `POST /api/clients/:slug/ingest/crawl`
- **Description**: Reads the crawl export directory, computes KPI summaries, generates structured tasks, and updates the client record.
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
    "wafBlocked403": 818,
    "healthScore": 92
  },
  "tasksGenerated": 3,
  "completedTasksPreserved": 5
}
```

---

### 3. Screaming Frog CSV Export Schemas

#### 3.1 `issues_overview_report.csv` Schema
| Column Name | Data Type | Nullable | Example / Values | Description |
|---|---|---|---|---|
| `Issue Name` | String | No | `"Page Titles: Missing"` | Categorical issue identifier |
| `Issue Type` | String | No | `"Issue"`, `"Warning"`, `"Opportunity"` | Screaming Frog classification |
| `Issue Priority` | String | No | `"High"`, `"Medium"`, `"Low"` | Priority level |
| `URLs` | Integer | No | `14` | Total affected URLs |
| `% of Total` | Float | No | `0.25` | Percentage of total crawled URLs |

#### 3.2 Individual Issue CSV Schema (`issues_reports/*.csv`)
| Column Name | Data Type | Notes |
|---|---|---|
| `Address` | URI String | Full absolute URL |
| `Content Type` | String | e.g., `text/html; charset=UTF-8` |
| `Status Code` | Integer | `200`, `301`, `302`, `403`, `404`, `500`, `504` |
| `Status` | String | `OK`, `Moved Permanently`, `Not Found` |
| `Indexability` | String | `Indexable`, `Non-Indexable` |
| `Inlinks` | Integer | Total internal links pointing to this URL |
| `Unique Inlinks` | Integer | Distinct internal pages linking to this URL |
| `Redirect URL` | URI String | Target destination URL (for 3xx responses) |

#### 3.3 Inlinks CSV Schema (`issues_reports/*_inlinks.csv`)
| Column Name | Data Type | Nullable | Example Values | Purpose |
|---|---|---|---|---|
| `Type` | String | No | `"Hyperlink"`, `"XML Sitemap"`, `"Image"` | Link medium |
| `Source` | URI String | No | `"https://brightpinkagency.com/blog/"` | Page containing the link |
| `Destination` | URI String | No | `"https://brightpinkagency.com/contact-us"` | Target URL returning 3xx/4xx/5xx |
| `Anchor` | String | Yes | `"Talk to a Strategist"` | Anchor text on source page |
| `Alt Text` | String | Yes | `""` | Image alt text if applicable |
| `Status Code` | Integer | No | `301`, `404` | Destination HTTP status code |
| `Follow` | Boolean | No | `true`, `false` | Whether the link is followed |
| `Path Type` | String | No | `"Absolute"`, `"Root-Relative"` | Link path format |
| `Link Path` | String | Yes | `"//body/div/div[3]/a"` | DOM XPath locator |
| `Link Position` | String | Yes | `"Navigation"`, `"Header"`, `"Footer"`, `"Content"` | Page section where link resides |
| `Link Origin` | String | Yes | `"HTML"`, `"Sitemap XML"` | Source origin |
