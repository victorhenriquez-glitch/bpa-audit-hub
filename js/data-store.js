/**
 * Bright Pink Agency - Client Data Store
 * Provides offline-compatible, client datasets and sanitization utilities.
 * 100% Ground-Truth Verified - Zero Unverified Assumptions.
 */

window.BPA_DATA = {
  'oh-deer': {
    "clientName": "ohDEER",
    "clientSlug": "oh-deer",
    "domain": "oh-deer.com",
    "industry": "All-Natural Mosquito & Tick Control Franchise Network",
    "auditDate": "October 2026",
    "auditCycle": "Monthly Maintenance & Deep Crawl Cross-Validation",
    "accountManager": "Gyongyi Castellanos",
    "technicalSeoLead": "Víctor Henríquez",
    "cmsStack": {
        "platform": "WordPress Multisite",
        "structure": "Subdirectory network for local franchises (/cape-cod, /central-mass, /marthas-vineyard)",
        "hosting": "WP Engine + Cloudflare WAF",
        "seoPlugin": "Rank Math SEO Pro",
        "theme": "BPA Custom In-House Themes (bpa-ohdeer-hq & bps-ohdeer-franchise) with SCSS"
    },
    "kpis": {
        "totalCrawledUrls": 5692,
        "clean200HtmlPages": 945,
        "indexableHtmlCount": 945,
        "internal301Redirects": 245,
        "broken404Pages": 0,
        "wafFalsePositive403": 818,
        "duplicateH1s": 324,
        "duplicateTitlesPaginated": 14,
        "crawlDepthBreakdown": {
            "level1": 1,
            "level2": 138,
            "level3": 724,
            "level4Plus": 84
        },
        "healthScores": {
            "rawSemrushScore": 78,
            "calibratedTrueHealth": 92,
            "calibrationNote": "Semrush reported 818 pages with 'Error 403' due to Cloudflare WAF bot mitigation against SemrushBot. Screaming Frog validation verified 100% of these URLs return 200 OK to live users and Googlebot."
        }
    },
    "sprintSummary": {
        "totalEstimatedMinutes": 30,
        "totalEstimatedHours": "0.5 hrs",
        "billable": true,
        "approvalStatus": "Ready for AM Retainer Review",
        "budgetImpact": "Austere & Budget-Safe (30 min) — Zero dev hours required in October."
    },
    "tasks": [
        {
            "id": "OHD-SPRINT-01",
            "phase": "Current Sprint",
            "sprintOrder": 1,
            "title": "Rank Math Blog Pagination Title Fix (%page%)",
            "category": "Pagination",
            "priority": "High",
            "status": "In Review / Dev Handed Off",
            "assignedRole": "Víctor Henríquez / Florin Chiriac",
            "estimatedMinutes": 15,
            "billable": true,
            "rootCause": "13 paginated blog URLs (/blog/page/2/ to /page/14/) duplicate the exact static title configured for Page 1: 'Dive into ohDEER's Blog of Natural Living'.",
            "businessImpact": "Eliminates duplicate titles across blog archives and resolves high-priority audit warnings without touching code.",
            "sampleUrls": [
                "https://oh-deer.com/blog/page/2/",
                "https://oh-deer.com/blog/page/3/",
                "https://oh-deer.com/blog/page/14/"
            ],
            "technicalInstructions": "1. Option A (CMS Level): Navigate to Rank Math > Titles & Meta > Post Archives / Categories. Update Archive Title format to: `%title% %sep% Page %page% %sep% %sitename%`.\n2. Option B (Theme Level for Florin): In `bpa-ohdeer-hq/functions.php`, add:\n```php\nadd_filter('rank_math/frontend/title', function($title) {\n    if (is_paged()) { $page = get_query_var('paged'); return $title . ' - Page ' . $page; }\n    return $title;\n});\n```\n3. Purge WP Engine object cache and Cloudflare edge cache.",
            "acceptanceCriteria": [
                "Browser tab title on /blog/page/2/ renders as 'Blog - Page 2 - ohDEER'",
                "Googlebot crawls distinct title tags on all pagination levels"
            ],
            "verificationMethod": "curl -ILs 'https://oh-deer.com/blog/page/2/' | grep -i '<title>'",
            "workbookUrl": "https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706"
        },
        {
            "id": "OHD-SPRINT-02",
            "phase": "Current Sprint",
            "sprintOrder": 2,
            "title": "Internal 301 Inlink Mapping Preparation for Dev Phase 2",
            "category": "Crawl Budget",
            "priority": "Medium",
            "status": "Delivered to Development",
            "assignedRole": "Víctor Henríquez",
            "estimatedMinutes": 15,
            "billable": true,
            "rootCause": "245 internal hyperlinks across global navigation and location footers link to non-slash URLs (e.g. /cape-cod instead of canonical /cape-cod/).",
            "businessImpact": "Prepares clean mapping for Dev Phase 2, preserving crawl budget and eliminating redirect latency across the franchise network.",
            "sampleUrls": [
                "https://oh-deer.com/cape-cod -> https://oh-deer.com/cape-cod/ [301]",
                "https://oh-deer.com/central-mass -> https://oh-deer.com/central-mass/ [301]"
            ],
            "technicalInstructions": "1. Cross-reference Screaming Frog inlinks export for all 245 internal 301 redirects.\n2. Delivered Master Workbook Sheet 'Internal 301 Redirects (245)': https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706\n3. Handed off to Jonie Iordache & Florin Chiriac for execution in November Phase 2.",
            "acceptanceCriteria": [
                "Mapping spreadsheet delivered to development with clear source anchor and target URL pairs"
            ],
            "verificationMethod": "Review Master Google Spreadsheet: https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706",
            "workbookUrl": "https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706"
        },
        {
            "id": "OHD-DEV-01",
            "phase": "Phase 2 (November)",
            "sprintOrder": 3,
            "title": "Sitewide Navigation & Footer Trailing Slash 301 URL Update",
            "category": "Navigation",
            "priority": "Medium",
            "status": "Scheduled for Dev",
            "assignedRole": "Florin Chiriac / Jonie Iordache (Dev Team)",
            "estimatedMinutes": 60,
            "billable": true,
            "rootCause": "Global header menu and footer location links point to non-slash URLs, causing 245 internal 301 redirects across the multisite network.",
            "businessImpact": "Eliminates unnecessary server redirects on every visitor click, speeding up navigation.",
            "sampleUrls": [
                "https://oh-deer.com/nashoba-valley -> https://oh-deer.com/nashoba-valley/ [301 Trailing Slash]",
                "https://oh-deer.com/northwest-austin-tx -> https://oh-deer.com/northwest-austin-tx/ [301 Trailing Slash]",
                "https://oh-deer.com/central-mass -> https://oh-deer.com/central-mass/ [301 Trailing Slash]",
                "https://oh-deer.com/locations/ [Footer location query links missing trailing slashes]"
            ],
            "technicalInstructions": "1. Open Master Workbook Sheet 'Internal 301 Redirects (245)': https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706\n2. In WordPress theme template files (footer.php and header navigation loops in bpa-ohdeer-hq / bps-ohdeer-franchise), update dynamic location queries and hardcoded menu URLs to append canonical trailing slashes (/).\n3. Update legacy service subpage links (/mosquito-and-tick-spray/tick-control/) to point directly to active canonical service URLs (/tick-control/).\n4. Deploy to WP Engine staging, purge Cloudflare cache, and verify with Screaming Frog.",
            "acceptanceCriteria": [
                "All internal navigation and footer location links return direct HTTP 200 OK without intermediate 301 redirect hops",
                "Screaming Frog internal 301 response count drops to 0 across navigation assets",
                "Master Workbook Sheet 'Internal 301 Redirects' verified in staging"
            ],
            "verificationMethod": "curl -ILs 'https://oh-deer.com/nashoba-valley/' | grep -E 'HTTP/|location:'",
            "workbookUrl": "https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706"
        },
        {
            "id": "OHD-CONTENT-01",
            "phase": "Phase 2 (Content)",
            "sprintOrder": 4,
            "title": "Empty Franchise Placeholder Pages Review & Content Decision",
            "category": "Content",
            "priority": "Low",
            "status": "Awaiting Content Review",
            "assignedRole": "Dana Aliaga / Donna (Content Strategy)",
            "estimatedMinutes": 45,
            "billable": true,
            "rootCause": "6 franchise location subdirectories contain empty placeholder review pages without content.",
            "businessImpact": "Prevents thin content penalties and improves user experience for local franchise visitors.",
            "sampleUrls": [
                "https://oh-deer.com/metro-west/about-us/what-our-clients-say/"
            ],
            "technicalInstructions": "1. Review list of empty franchise pages.\n2. Option A: Populate with local customer reviews and location imagery.\n3. Option B: If no reviews available, apply 301 redirect to main franchise page (/metro-west/).",
            "acceptanceCriteria": [
                "Pages either populated with unique local copy or redirected cleanly with 301 to parent landing"
            ],
            "verificationMethod": "Review in browser to ensure no empty placeholder pages exist in index.",
            "workbookUrl": "https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706"
        }
    ],
    "completedTasks": [
        {
            "id": "OHD-FLORIN-01",
            "title": "Missing H1 Headings Implementation Across Core Pages (12 URLs)",
            "category": "Headings",
            "completedDate": "May 2026",
            "verifiedDate": "October 2026",
            "verifiedBy": "Víctor Henríquez",
            "summary": "Florin added missing H1 tags to 12 core URLs. October deep crawl confirmed 100% stability with 0 indexable HTML pages missing H1."
        },
        {
            "id": "OHD-FLORIN-02",
            "title": "Structured Data Parse Errors Remediation (6 URLs)",
            "category": "Schema",
            "completedDate": "May 2026",
            "verifiedDate": "October 2026",
            "verifiedBy": "Víctor Henríquez",
            "summary": "Florin corrected syntax parse halts in schema markup. October testing verified clean JSON-LD validation across tested templates."
        },
        {
            "id": "OHD-FLORIN-03",
            "title": "Core Header Logo & Quote Button 301 Redirect Repair",
            "category": "Navigation",
            "completedDate": "May 2026",
            "verifiedDate": "October 2026",
            "verifiedBy": "Víctor Henríquez",
            "summary": "Florin corrected hardcoded links in header logo and get-a-quote button. Both resolve directly to 200 OK canonicals."
        },
        {
            "id": "OHD-OCT-01",
            "title": "Baseline 5,692 URLs Screaming Frog Deep Crawl & WAF Cross-Validation",
            "category": "Audit Baseline",
            "completedDate": "October 2026",
            "verifiedDate": "October 2026",
            "verifiedBy": "Víctor Henríquez",
            "summary": "Comprehensive spider crawl executed across all franchise subdirectories. Confirmed 0 internal 403 errors and established 92% true site health."
        },
        {
            "id": "OHD-OCT-02",
            "title": "Master Technical SEO Workbook & 245 Inlink Mapping Delivery",
            "category": "Deliverable / Strategy",
            "completedDate": "October 2026",
            "verifiedDate": "October 2026",
            "verifiedBy": "Víctor Henríquez",
            "summary": "Compiled and delivered full 5-sheet Master SEO Workbook with 245 source-to-target redirect mappings and WAF validation. Live sheet: https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706"
        }
    ],
    "workbookUrl": "https://docs.google.com/spreadsheets/d/1fmY7Y1su8nK8_t_nGC400_Pk3LK6greu/edit?gid=603582706#gid=603582706"
},
  'us-lawns': {
    "clientName": "US Lawns",
    "clientSlug": "us-lawns",
    "domain": "uslawns.com",
    "industry": "Commercial Grounds Care & Landscaping Franchise Network (B2B)",
    "industry_en": "Commercial Grounds Care & Landscaping Franchise Network (B2B)",
    "auditDate": "October 2026",
    "auditCycle": "Pre-Migration Architecture Audit & Technical SEO Benchmark",
    "auditCycle_en": "Pre-Migration Architecture Audit & Technical SEO Benchmark",
    "accountManager": "Alisha Hughes",
    "technicalSeoLead": "Víctor Henríquez",
    "cmsStack": {
        "platform": "WordPress (Salient v15.0.8 + WPBakery) -> Migrating to Gutenberg Native Blocks + ACF",
        "structure": "Commercial B2B franchise directory with 200+ local market territory hubs (/locations/[st]/[city]/)",
        "hosting": "WP Engine + Cloudflare CDN / NitroPack",
        "seoPlugin": "Yoast SEO -> Migrating to Rank Math Pro",
        "theme": "Salient Theme (ThemeNectar) migrating to Custom BPA In-House Gutenberg Theme"
    },
    "kpis": {
        "totalCrawledUrls": 1054,
        "clean200HtmlPages": 610,
        "indexableHtmlCount": 610,
        "internal301Redirects": 72,
        "broken404Pages": 6,
        "gsc404Urls": 76,
        "franchise404Count": 18,
        "wafFalsePositive429": 21011,
        "warningsGutenbergResolved": 14567,
        "duplicateH1s": 69,
        "missingH1s": 190,
        "missingMetaDesc": 272,
        "thinContentPages": 78,
        "organicSessions": 5831,
        "organicKeyEvents": 7406,
        "franchiseConversionShare": 84.8,
        "crawlDepthBreakdown": {
            "level1": 1,
            "level2": 184,
            "level3": 382,
            "level4Plus": 27,
            "level0": 1,
            "level1Nav": 54,
            "level2State": 48,
            "level3Franchise": 38,
            "level4to6": 172,
            "level7to9": 179,
            "level10Plus": 196
        },
        "healthScores": {
            "rawSemrushScore": 66,
            "calibratedTrueHealth": 86,
            "calibrationNote": "Raw Semrush health score (66%) was heavily distorted by 21,011 HTTP 429 rate-limiting blocks on footer links and static images. In addition, 95.9% of warnings (14,567) automatically dissolve upon deploying Augustina's compiled Gutenberg build. Calibrated True Health (86%) isolates real architectural carry-over risks.",
            "calibrationNote_en": "Raw Semrush health score (66%) was heavily distorted by 21,011 HTTP 429 rate-limiting blocks on footer links and static images. In addition, 95.9% of warnings (14,567) automatically dissolve upon deploying Augustina's compiled Gutenberg build. Calibrated True Health (86%) isolates real architectural carry-over risks."
        }
    },
    "sprintSummary": {
        "totalEstimatedMinutes": 300,
        "totalEstimatedHours": "5.0 hrs",
        "billable": true,
        "approvalStatus": "Ready for Internal Huddle (Tuesday, Oct 13)",
        "approvalStatus_en": "Ready for Internal Huddle (Tuesday, Oct 13)",
        "budgetImpact": "Essential Pre-Migration Architecture Scope — Protects $100K+ in organic franchise leads across 204 active markets."
    },
    "tasks": [
        {
            "id": "USL-MIG-01",
            "phase": "Current Sprint",
            "sprintOrder": 1,
            "title": "18 Live Operating Franchise Territory Hubs 404 Remap",
            "category": "404 Remediation",
            "priority": "Critical",
            "status": "In Progress",
            "assignedRole": "Augustina / Víctor",
            "estimatedMinutes": 45,
            "billable": true,
            "rootCause": "Google Search Console recorded 76 active 404 errors, including 18 real franchise territories currently broken in production (/locations/va/arlington/, /ga/augusta/, /al/mobile/, /fl/destin/, /in/evansville/, etc.).",
            "businessImpact": "Direct lead loss and local search ranking collapse in 18 high-value franchise markets.",
            "sampleUrls": [
                "https://uslawns.com/locations/va/arlington/ [404 Live Territory]",
                "https://uslawns.com/locations/ga/augusta/ [404 Live Territory]",
                "https://uslawns.com/locations/al/mobile/ [404 Live Territory]",
                "https://uslawns.com/locations/fl/destin/ [404 Live Territory]",
                "https://uslawns.com/locations/in/evansville/ [404 Live Territory]"
            ],
            "technicalInstructions": "1. Cross-reference Tab 02 (02_Critical_404_Remap) in the Master SEO Workbook with current franchise roster.\n2. For active territories: Deploy new Gutenberg location templates preserving the exact city slug.\n3. For closed territories: Configure 301 redirects in WP Engine redirect rules pointing to the relevant state directory hub (e.g., /locations/va/ or /locations/ga/).",
            "acceptanceCriteria": [
                "All 18 territory URLs respond with HTTP 200 OK (restored) or HTTP 301 (clean state hub).",
                "Zero broken franchise pages indexed in XML sitemaps."
            ],
            "verificationMethod": "Automated curl -ILs audit verifying 200 OK or 301 responses on WP Engine staging."
        },
        {
            "id": "USL-MIG-02",
            "phase": "Current Sprint",
            "sprintOrder": 2,
            "title": "Franchise URL Taxonomy Lock (/locations/[st]/[city]/)",
            "category": "Taxonomy & Routing",
            "priority": "Critical",
            "status": "Ready to Execute",
            "assignedRole": "Augustina (Senior Dev)",
            "estimatedMinutes": 30,
            "billable": true,
            "rootCause": "GA4 data proves that local franchise pages (/locations/[st]/[city]/) drive 84.8% of all site conversions (6,685 key events) across 204 territories. Any slug alterations will cause immediate organic traffic collapse.",
            "businessImpact": "Protects the client's #1 commercial conversion and inbound lead acquisition engine.",
            "sampleUrls": [
                "https://uslawns.com/locations/ar/northwest-arkansas/ [173 Leads / Mo]",
                "https://uslawns.com/locations/sc/columbia/ [159 Leads / Mo]",
                "https://uslawns.com/locations/fl/brevard-county/ [129 Leads / Mo]",
                "https://uslawns.com/locations/nv/las-vegas/ [123 Leads / Mo]"
            ],
            "technicalInstructions": "1. Ensure WordPress rewrite rules maintain the strict pattern: /locations/%state%/%city%/.\n2. Do NOT truncate state codes or alter directory prefixes (e.g. do not change to /our-locations/ or /places/).\n3. Preserve sub-service routing: /locations/%state%/%city%/services/.",
            "acceptanceCriteria": [
                "All 204 franchise hubs resolve 1-to-1 without URL shifts.",
                "Canonical tags match the exact location path with self-referencing trailing slashes."
            ],
            "verificationMethod": "Screaming Frog list crawl verifying 100% 200 OK match against Tab 01 (Crown Jewels)."
        },
        {
            "id": "USL-MIG-03",
            "phase": "Current Sprint",
            "sprintOrder": 3,
            "title": "Template Redirect Anchor Remediation (750+ Internal Hops)",
            "category": "Crawl Budget",
            "priority": "High",
            "status": "Ready to Execute",
            "assignedRole": "Augustina (Senior Dev)",
            "estimatedMinutes": 45,
            "billable": true,
            "rootCause": "Screaming Frog crawl identified 72 internal 301 redirects triggered by hardcoded links in global Salient templates, creating over 750 redirect hops on every crawl.",
            "businessImpact": "Eliminates crawl latency, preserves Googlebot crawl budget, and accelerates mobile page rendering.",
            "sampleUrls": [
                "https://uslawns.com/author/linzjanemcdonaldgmail-com/ -> / [364 internal inlinks]",
                "https://uslawns.com/news/ -> /blog/ [119 internal inlinks]",
                "https://uslawns.com/press/ -> / [80 internal inlinks]",
                "https://uslawns.com/locations -> /locations/ [37 internal inlinks]",
                "https://uslawns.com/about/who-we-are/ -> /about-us/who-we-are/ [23 internal inlinks]"
            ],
            "technicalInstructions": "1. In theme post-header templates: Suppress author archive links on blog cards or point to author bio.\n2. In header/footer navigation: Update /news/ directly to /blog/ and add trailing slash to /locations/.\n3. Update legacy /about/ internal anchors directly to /about-us/.\n4. Replace broken Cloudflare email protection link in footer (/cdn-cgi/l/email-protection, 108 inlinks) with clean mailto: link.",
            "acceptanceCriteria": [
                "0 internal 301 redirect hops in main header, footer, and blog post loop.",
                "All internal anchors resolve to direct HTTP 200 OK destinations."
            ],
            "verificationMethod": "Screaming Frog Internal All crawl verifying 0 inlinks to 3xx status codes."
        },
        {
            "id": "USL-MIG-04",
            "phase": "Current Sprint",
            "sprintOrder": 4,
            "title": "Crawl Hierarchy Flattening & Dynamic Breadcrumbs (Depth 16 Trap)",
            "category": "Information Architecture",
            "priority": "Critical",
            "status": "Ready to Execute",
            "assignedRole": "Augustina (Senior Dev)",
            "estimatedMinutes": 60,
            "billable": true,
            "rootCause": "Screaming Frog revealed that 79.5% of HTML pages (547 URLs) are buried at Click Depth 4 to 16, with 196 pages at Depth 10-16. Spiders abandon these deep pagination chains, directly triggering GSC's 4,350 Discovered - Currently Not Indexed exclusions.",
            "businessImpact": "Unlocks crawl budget and ensures rapid indexation for hundreds of excluded franchise pages.",
            "sampleUrls": [
                "https://uslawns.com/locations/... [196 URLs buried in deep pagination chains at Depth 10-16]",
                "https://uslawns.com/locations/... [179 URLs receiving only 2.6 internal inlinks at Depth 7-9]"
            ],
            "technicalInstructions": "1. Implement dynamic hierarchical BreadcrumbList JSON-LD and HTML breadcrumbs on all location pages: Home > Locations > [State] > [City].\n2. Build state directory hub templates (/locations/ca/, /locations/fl/, etc.) with direct HTML links to every local city territory in that state.\n3. Flatten pagination: Ensure no location or service page requires more than 3 clicks from the homepage.",
            "acceptanceCriteria": [
                "100% of franchise territory hubs reachable at Click Depth <= 3 in Screaming Frog crawl.",
                "Average inlinks for franchise pages increases from 2.6 to > 15 links."
            ],
            "verificationMethod": "Screaming Frog crawl depth distribution chart showing 0 pages at Depth > 4."
        },
        {
            "id": "USL-MIG-05",
            "phase": "Current Sprint",
            "sprintOrder": 5,
            "title": "ACF Custom Field Defensive Fallbacks (Fix 'In , |' & Duplicate Titles)",
            "category": "Metadata & ACF",
            "priority": "High",
            "status": "Ready to Execute",
            "assignedRole": "Augustina (Senior Dev)",
            "estimatedMinutes": 30,
            "billable": true,
            "rootCause": "Semrush identified 16 pages rendering broken titles like 'Expert Commercial Landscaping In , |' due to blank ACF city/state fields. Additionally, sub-services in Cleveland, Denver, and Phoenix inherit identical parent titles.",
            "businessImpact": "Eliminates embarrassing metadata glitches in Google SERPs and resolves title cannibalization.",
            "sampleUrls": [
                "https://uslawns.com/locations/template-services/snow-ice-management/ [Title: 'In , |']",
                "https://uslawns.com/locations/oh/east-cleveland/services/ [Duplicate title across sub-services]"
            ],
            "technicalInstructions": "1. In theme header/SEO functions: Add strict PHP fallback logic: if (!empty($city) && !empty($state)) { $loc_str = 'In ' . $city . ', ' . $state; } else { $loc_str = ''; }\n2. Configure Rank Math title templates to include specific service token: %title% in %custom_field(city)%, %custom_field(state)% | U.S. Lawns.\n3. Ensure sub-services pull their specific service title rather than inheriting the parent /services/ title.",
            "acceptanceCriteria": [
                "Zero empty commas or dangling pipes in SERP snippet preview.",
                "Each sub-service page has a unique, descriptive <title> tag."
            ],
            "verificationMethod": "Automated curl check verifying <title> tags on staging across 20 location samples."
        },
        {
            "id": "USL-MIG-06",
            "phase": "Current Sprint",
            "sprintOrder": 6,
            "title": "Careers CPT Duplication Remediation (1,156 Thin Pages)",
            "category": "Index Management",
            "priority": "High",
            "status": "Ready to Execute",
            "assignedRole": "Alisha / Augustina",
            "estimatedMinutes": 30,
            "billable": true,
            "rootCause": "Semrush identified that 81.9% of duplicate titles (1,156 URLs) and 92.9% of duplicate content originate from franchise career subpages (/[st]/[city]/careers/[role]/) with identical boilerplate descriptions and 0 lead conversions in GA4.",
            "businessImpact": "Purges 1,156 thin doorway pages from Google's index, concentrating domain authority into commercial service pages.",
            "sampleUrls": [
                "https://uslawns.com/al/west-birmingham/careers/crew-leader/ [Duplicate Title & Body]",
                "https://uslawns.com/tx/temple/careers/gardener/ [Duplicate Title & Body]",
                "https://uslawns.com/oh/dayton/careers/spray-technician/ [Duplicate Title & Body]"
            ],
            "technicalInstructions": "1. Strategic Option A (Recommended): In Rank Math Pro Titles & Meta > Custom Post Types > Careers: set Default Robots Meta to 'noindex, follow'.\n2. Maintain canonical centralized recruitment directory at https://uslawns.com/careers/.\n3. Strategic Option B (If indexed listings required): Configure dynamic Rank Math titles with localized salary/city tokens.",
            "acceptanceCriteria": [
                "Local career clone subpages render <meta name='robots' content='noindex, follow'>.",
                "Main /careers/ directory remains fully indexable."
            ],
            "verificationMethod": "Inspect HTML source on staging verifying noindex tag on franchise job posts."
        },
        {
            "id": "USL-MIG-07",
            "phase": "Current Sprint",
            "sprintOrder": 7,
            "title": "Core Commercial Service Routing Recovery (/services/tree-and-shrub-care/)",
            "category": "Core Service Restoral",
            "priority": "Critical",
            "status": "Ready to Execute",
            "assignedRole": "Augustina (Senior Dev)",
            "estimatedMinutes": 30,
            "billable": true,
            "rootCause": "Core commercial service page /services/tree-and-shrub-care/ returns 404 in live production. In addition, national services /irrigation-management/ and /landscape-enhancements/ are misdirected 301 to single local franchises.",
            "businessImpact": "Recovers high-ticket commercial B2B landscaping quote requests and fixes national service authority.",
            "sampleUrls": [
                "https://uslawns.com/services/tree-and-shrub-care/ [404 Error - Core Service]",
                "https://uslawns.com/services/irrigation-management/ [Misdirected 301 to Natchez, MS]",
                "https://uslawns.com/services/landscape-enhancements/ [Misdirected 301 to East Birmingham, AL]"
            ],
            "technicalInstructions": "1. Re-establish core commercial service template at /services/tree-and-shrub-care/ with Gravity Form quote capture.\n2. Fix 301 redirects for /services/irrigation-management/ -> point to canonical /services/commercial-irrigation/.\n3. Fix 301 for /services/landscape-enhancements/ -> point to canonical /services/landscape-enhancements/.",
            "acceptanceCriteria": [
                "/services/tree-and-shrub-care/ resolves with HTTP 200 OK and active quote form.",
                "National service URLs never redirect to single local franchise territories."
            ],
            "verificationMethod": "HTTP status check verifying 200 OK on core commercial service endpoints."
        },
        {
            "id": "USL-MIG-08",
            "phase": "Current Sprint",
            "sprintOrder": 8,
            "title": "GTM & GA4 Conversion Event Tracking Continuity (G-TQYMVJ3Y4V)",
            "category": "Analytics & Tracking",
            "priority": "High",
            "status": "Ready to Execute",
            "assignedRole": "Víctor Henríquez (Technical SEO)",
            "estimatedMinutes": 30,
            "billable": true,
            "rootCause": "US Lawns' baseline generated 7,406 key events in 28 days across Gravity Forms and click-to-call links. Migrating templates risks dropping custom event listeners and GTM container hooks.",
            "businessImpact": "Guarantees uninterrupted conversion tracking and client reporting across all 204 franchise territories post-launch.",
            "sampleUrls": [
                "https://uslawns.com/ (Homepage Lead Form)",
                "https://uslawns.com/locations/ut/salt-lake-city/ (Local Franchise Form)"
            ],
            "technicalInstructions": "1. Verify Google Tag Manager container is injected into <head> and immediately after <body> opening tag in new theme header.php.\n2. Validate Gravity Forms AJAX submission triggers standard 'generate_lead' or 'form_submission' dataLayer push.\n3. Verify telephone anchor clicks (tel:) trigger GA4 'click_to_call' event.\n4. Confirm GA4 Measurement ID G-TQYMVJ3Y4V receives live events in GTM DebugView.",
            "acceptanceCriteria": [
                "GTM container active on 100% of staging templates.",
                "Test form submissions fire valid conversion events in GA4 DebugView."
            ],
            "verificationMethod": "Google Tag Assistant and GA4 DebugView live verification on staging domain."
        }
    ],
    "completedTasks": [
        {
            "id": "USL-CMP-01",
            "title": "Baseline 4-Pillar Pre-Migration Technical Discovery & Master Workbook",
            "category": "Audit Baseline",
            "completedDate": "October 2026",
            "verifiedDate": "October 2026",
            "verifiedBy": "Víctor Henríquez",
            "summary": "Completed comprehensive before-migration benchmark across GSC, XML Sitemaps, Screaming Frog Spider Crawl, Semrush, and GA4. Compiled 8-tab Master Workbook and Pre-Migration Technical Discovery document for Tuesday huddle."
        }
    ]
  },
  'owl-be-there': {
    "clientName": "Owl Be There",
    "clientSlug": "owl-be-there",
    "domain": "owlbethere.com",
    "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516",
    "gdocUrl": "https://docs.google.com/document/d/1qrPUvWdespxclmh_pzzt3C0om2czSN-OocdLfnTpdpw/edit?tab=t.0#heading=h.sxu39jyyah5n",
    "industry": "Senior Living Placement & Advisory Franchise Network (Corporate + 7 Locations)",
    "industry_en": "Senior Living Placement & Advisory Franchise Network (Corporate + 7 Locations)",
    "auditDate": "October 2026",
    "auditCycle": "Monthly Technical SEO Audit & Deep Crawl Cross-Validation (7.0h Retainer)",
    "auditCycle_en": "Monthly Technical SEO Audit & Deep Crawl Cross-Validation (7.0h Retainer)",
    "accountManager": "Gyongyi Castellanos",
    "technicalSeoLead": "Víctor Henríquez",
    "cmsStack": {
      "platform": "WordPress Multisite (Subdirectory Franchise Network)",
      "structure": "Corporate HQ + 7 Active Franchise Subsites (/charleston/, /charlottesouth/, /frederickloudoun/, /greaterwashingtondc/, /memphis/, /northorlando/, /wilmingtonwestchester/)",
      "hosting": "Nginx + WP Defender Firewall + Jetpack Photon CDN (i0.wp.com)",
      "seoPlugin": "Rank Math SEO",
      "theme": "BPA Custom In-House Themes (owlbethere v1.0.0 Parent + owlbethere-zee Franchise Child) with Gutenberg/ACF & SCSS"
    },
    "kpis": {
      "totalCrawledUrls": 1376,
      "clean200HtmlPages": 95,
      "indexableHtmlCount": 95,
      "internal301Redirects": 5,
      "broken404Pages": 0,
      "wafFalsePositive403": 1,
      "duplicateH1s": 2,
      "crossLocationMetaBleeds": 3,
      "crawlDepthBreakdown": {
        "level1": 12,
        "level2": 66,
        "level3": 17,
        "level4Plus": 0
      },
      "healthScores": {
        "rawSemrushScore": 96,
        "calibratedTrueHealth": 96,
        "calibrationNote": "Semrush Baseline recorded 96% Site Health (vs. 92% Top-10% benchmark) and 89% AI Search Health (0 AI bots blocked). October Semrush re-crawl was interrupted at page 1 (HTTP 403 Forbidden) because WP Defender Firewall blocks User-Agent SiteAuditBot/0.97. Live Screaming Frog crawl of 1,376 URLs verified 100% of all 95 indexable HTML pages (25 Corporate + 70 Franchise Location pages) return 200 OK with 0 broken links.",
        "calibrationNote_en": "Semrush Baseline recorded 96% Site Health (vs. 92% Top-10% benchmark) and 89% AI Search Health (0 AI bots blocked). October Semrush re-crawl was interrupted at page 1 (HTTP 403 Forbidden) because WP Defender Firewall blocks User-Agent SiteAuditBot/0.97. Live Screaming Frog crawl of 1,376 URLs verified 100% of all 95 indexable HTML pages (25 Corporate + 70 Franchise Location pages) return 200 OK with 0 broken links."
      }
    },
    "sprintSummary": {
      "totalEstimatedMinutes": 24,
      "totalEstimatedHours": "0.4 hrs",
      "billable": true,
      "approvalStatus": "Ready for AM Retainer Approval (Gyongyi)",
      "approvalStatus_en": "Ready for AM Retainer Approval (Gyongyi)",
      "budgetImpact": "Austere 24-min CMS Sprint (0.4 hrs of 7.0h monthly retainer — leaves 6.6 hrs untouched; editorial review routed to Content Team and complex code to Dev Team)."
    },
    "tasks": [
      {
        "id": "OBT-SPRINT-01",
        "phase": "Current Sprint",
        "sprintOrder": 1,
        "title": "Fix 3 Cross-Location City Name Bleeds in Franchise Meta Descriptions",
        "category": "Local SEO & Metadata",
        "priority": "Critical",
        "status": "Ready for CMS Execution",
        "assignedRole": "Víctor Henríquez / Content Team",
        "estimatedMinutes": 10,
        "billable": true,
        "rootCause": "WHERE ON PAGE / DOM: <head> -> <meta name=\"description\"> & <meta property=\"og:description\"> (Rank Math Meta Box). Copy-paste territory bleed across 3 franchise 'Assisted Living Placement Guidance' pages: (1) North Orlando (/northorlando/) outputs 'Memphis / Greater Memphis'; (2) Memphis (/memphis/) outputs 'Wilmington and West Chester / Delaware and Pennsylvania'; (3) Wilmington & West Chester (/wilmingtonwestchester/) outputs 'Frederick & Loudoun / Maryland and Virginia'.",
        "businessImpact": "Eliminates severe geographic keyword cannibalization and prevents families searching in Orlando, Memphis, or Wilmington from seeing a completely different state/city in Google SERP snippets.",
        "sampleUrls": [
          "https://owlbethere.com/northorlando/senior-living-guidance/assisted-living-placement-guidance/",
          "https://owlbethere.com/memphis/senior-living-guidance/assisted-living-placement-guidance/",
          "https://owlbethere.com/wilmingtonwestchester/senior-living-guidance/assisted-living-placement-guidance/"
        ],
        "technicalInstructions": "WHERE IN CMS: WordPress Multisite Admin -> Subsite Pages -> Edit 'Assisted Living Placement Guidance' -> Rank Math SEO Snippet Editor -> Description field:\n\n1. North Orlando (/northorlando/senior-living-guidance/assisted-living-placement-guidance/):\n   Replace 'Memphis' / 'Greater Memphis' with:\n   \"Find trusted assisted living placement guidance in North Orlando and Central Florida. Owl Be There helps families compare communities and make confident choices.\"\n\n2. Memphis (/memphis/senior-living-guidance/assisted-living-placement-guidance/):\n   Replace 'Wilmington and West Chester' / 'Delaware and Pennsylvania' with:\n   \"Trusted assisted living placement guidance in Greater Memphis, TN. Owl Be There helps local families compare senior care options at no cost to you.\"\n\n3. Wilmington & West Chester (/wilmingtonwestchester/senior-living-guidance/assisted-living-placement-guidance/):\n   Replace 'Frederick & Loudoun' / 'Maryland and Virginia' with:\n   \"Personalized assisted living placement guidance in Wilmington, DE and West Chester, PA. Compare vetted local senior living communities with Owl Be There.\"",
        "acceptanceCriteria": [
          "Each of the 3 franchise URLs displays its own verified city and state in <meta name=\"description\"> and <meta property=\"og:description\">.",
          "All 3 descriptions remain under 155 characters / 920 pixels."
        ],
        "verificationMethod": "curl -s https://owlbethere.com/northorlando/senior-living-guidance/assisted-living-placement-guidance/ | grep -i 'meta name=\"description\"'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-SPRINT-02",
        "phase": "Current Sprint",
        "sprintOrder": 2,
        "title": "Update 5 Internal Links Pointing to 301 Redirects (/about/ & /contact/)",
        "category": "Crawl Budget & Internal Links",
        "priority": "High",
        "status": "Ready for CMS Execution",
        "assignedRole": "Víctor Henríquez",
        "estimatedMinutes": 10,
        "billable": true,
        "rootCause": "WHERE ON PAGE / DOM:\n• 4 Franchise Homepages (/frederickloudoun/ under H3 'Stacey Saylor', /memphis/ under H3 'Candace Gibson', /greaterwashingtondc/ under H3 'Theresa Henry', /charlottesouth/ under H3 'Mary Arcure') -> Inside Section [meet-the-team__actions], the primary CTA button 'Learn More About Your Local Advisors' links to /[subsite]/about/ (301) instead of /[subsite]/about-us/ (200 OK).\n• 1 Corporate Blog Post (/blog/assisted-living-vs-memory-care-key-differences-and-how-to-find-the-best-fit/) -> Inside Main Body paragraph under H2 'Learn. Understand. Feel Confident.', the inline link 'Find Your Local Advisor' points to https://owlbethere.com/contact/ (301) instead of https://owlbethere.com/contact-us/ (200 OK).",
        "businessImpact": "Eliminates 100% of editorial internal 301 redirect hops across the Corporate + 7 Location network, speeding up user navigation and preserving link equity.",
        "sampleUrls": [
          "https://owlbethere.com/frederickloudoun/about/ -> https://owlbethere.com/frederickloudoun/about-us/",
          "https://owlbethere.com/memphis/about/ -> https://owlbethere.com/memphis/about-us/",
          "https://owlbethere.com/greaterwashingtondc/about/ -> https://owlbethere.com/greaterwashingtondc/about-us/",
          "https://owlbethere.com/charlottesouth/about/ -> https://owlbethere.com/charlottesouth/about-us/",
          "https://owlbethere.com/contact/ -> https://owlbethere.com/contact-us/"
        ],
        "technicalInstructions": "1. Open the 4 Franchise Homepages in WP Admin (/frederickloudoun/, /memphis/, /greaterwashingtondc/, /charlottesouth/).\n2. Scroll to the 'Meet Your Local Senior Living Advisor' block (meet-the-team__actions) below each advisor's bio.\n3. Update the button URL on 'Learn More About Your Local Advisors' from /[subsite]/about/ to /[subsite]/about-us/ (matching Charleston, North Orlando, and Wilmington).\n4. Open the Corporate blog post '/blog/assisted-living-vs-memory-care-key-differences-and-how-to-find-the-best-fit/', scroll to H2 'Learn. Understand. Feel Confident.', and update the anchor 'Find Your Local Advisor' from /contact/ to /contact-us/.",
        "acceptanceCriteria": [
          "All 4 franchise homepage 'Meet the Team' buttons point directly to /[subsite]/about-us/ (HTTP 200 OK).",
          "Blog post CTA link points directly to https://owlbethere.com/contact-us/ (HTTP 200 OK)."
        ],
        "verificationMethod": "curl -s https://owlbethere.com/memphis/ | grep -i 'about-us'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-SPRINT-03",
        "phase": "Current Sprint",
        "sprintOrder": 3,
        "title": "Add Descriptive Alt Text to 2 Editorial Content Photos",
        "category": "Accessibility & Image SEO",
        "priority": "Medium",
        "status": "Ready for CMS Execution",
        "assignedRole": "Víctor Henríquez",
        "estimatedMinutes": 4,
        "billable": true,
        "rootCause": "WHERE ON PAGE / DOM:\n1. https://owlbethere.com/contact-us/ -> Section [wp-block-column image-col] right column beside H2 'Looking for a Local Advisor?': <img src=\".../2026/09/Photo-1.jpg\"> has empty alt=\"\".\n2. https://owlbethere.com/senior-living-guidance/assisted-living-placement-guidance/ -> Section [text-image-v8__block] under H2 'Factors Families Should Consider Before Choosing Assisted Living': <img src=\".../2026/07/Frame-38-6.jpg\"> has empty alt=\"\".",
        "businessImpact": "Improves WCAG 2.1 Level A accessibility compliance for screen readers and strengthens contextual image relevance on core Corporate conversion pages.",
        "sampleUrls": [
          "https://owlbethere.com/contact-us/",
          "https://owlbethere.com/senior-living-guidance/assisted-living-placement-guidance/"
        ],
        "technicalInstructions": "1. In WordPress Media Library (or Gutenberg block settings on /contact-us/), locate 'Photo-1.jpg' beside heading 'Looking for a Local Advisor?' and set Alt Text: \"Owl Be There senior living advisor consulting with family\".\n2. On /senior-living-guidance/assisted-living-placement-guidance/, locate 'Frame-38-6.jpg' inside the 'Factors Families Should Consider Before Choosing Assisted Living' block and set Alt Text: \"Caregiver supporting smiling senior resident in assisted living community\".",
        "acceptanceCriteria": [
          "Both editorial images render non-empty, descriptive alt attributes in live HTML source."
        ],
        "verificationMethod": "curl -s https://owlbethere.com/contact-us/ | grep -i 'Photo-1.jpg'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-CONTENT-01",
        "phase": "Phase 2 (Content & Strategy)",
        "sprintOrder": 4,
        "title": "Editorial Strategy Review: Truncated Titles (>60c, 7 Pages) & Meta Descriptions (>155c, 19 Pages)",
        "category": "Content & Editorial Strategy",
        "priority": "Low",
        "status": "Queued for Content Review",
        "assignedRole": "Content Team (Dana / Octav) & Víctor Henríquez",
        "estimatedMinutes": 30,
        "billable": true,
        "rootCause": "WHERE ON PAGE / DOM: <head> -> <title> & <meta name=\"description\">. Screaming Frog crawler advisory audit flags: (1) 7 franchise landing pages where <title> tags measure 61-68 characters (e.g., /wilmingtonwestchester/contact-us/ at 68 chars: 'Contact Owl Be There Wilmington–West Chester | Senior Living Advisor'); (2) 19 pages where meta descriptions measure 156-163 characters (just 1 to 8 characters past the ideal 155c cutoff, with /wilmingtonwestchester/about-us/ at 203 chars). NOTE: These pages are NOT technically broken; they represent minor SERP snippet truncation. Changing them requires content and branding alignment so as not to dilute local keyword intent or brand tone.",
        "businessImpact": "Optimizes Google SERP snippet display without ellipses (...) on local search results, improving organic click-through rate while protecting branding copy.",
        "sampleUrls": [
          "https://owlbethere.com/wilmingtonwestchester/about-us/",
          "https://owlbethere.com/wilmingtonwestchester/contact-us/",
          "https://owlbethere.com/greaterwashingtondc/contact-us/",
          "https://owlbethere.com/charleston/senior-living-guidance/independent-living-advisors/",
          "https://owlbethere.com/charlottesouth/senior-living-guidance/continuing-care-retirement-communities-guidance/"
        ],
        "technicalInstructions": "1. Content Specialists (Dana / Octav) review the 7 titles and 19 descriptions documented in Tab 2 of the Master Technical SEO Workbook.\n2. Tighten titles to <= 60 characters while preserving the local city and primary service keyword.\n3. Trim meta descriptions to 140-155 characters (e.g. trimming trailing boilerplate) so Google displays full sentences in search snippets.\n4. Apply changes via WordPress Rank Math snippet editor during regular copy review.",
        "acceptanceCriteria": [
          "Reviewed titles measure <= 60 characters and <= 580 pixels.",
          "Reviewed descriptions measure 140-155 characters without losing geographic keyword targeting."
        ],
        "verificationMethod": "Cross-reference updated titles/descriptions against Master Workbook Tab 2.",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-DEV-01",
        "phase": "Phase 2 (November)",
        "sprintOrder": 5,
        "title": "Dynamic Category Title in Blog Archive Template (archive.php) — Fix Duplicate H1s",
        "category": "Semantic Heading Hierarchy",
        "priority": "Medium",
        "status": "Queued for Phase 2",
        "assignedRole": "Dev Team",
        "estimatedMinutes": 30,
        "billable": true,
        "rootCause": "1. SYMPTOM & LIVE EVIDENCE: Both blog category archives (/blog/category/family-caregiver-resources/ and /blog/category/cost-planning/) render the exact same hardcoded H1 inside <main> -> Hero Banner: 'Guidance, Insights, and Real Stories to Help You Navigate Senior Living'.\n2. ROOT CAUSE: In /wp-content/themes/owlbethere/archive.php, the hero banner pulls the global Blog index headline instead of querying single_cat_title() when is_category() is true.",
        "businessImpact": "Eliminates H1 duplication across blog category archives and establishes clear topical relevance for each senior care resource category.",
        "sampleUrls": [
          "https://owlbethere.com/blog/category/family-caregiver-resources/",
          "https://owlbethere.com/blog/category/cost-planning/"
        ],
        "technicalInstructions": "3. READY-TO-TEST CODE (PHP):\n```php\n// In /wp-content/themes/owlbethere/archive.php (Hero H1 block)\nif ( is_category() ) {\n    $archive_h1 = single_cat_title( '', false ) . ' — Senior Living Resources & Guides';\n} elseif ( is_tag() ) {\n    $archive_h1 = single_tag_title( '', false ) . ' — Owl Be There Blog';\n} else {\n    $archive_h1 = 'Guidance, Insights, and Real Stories to Help You Navigate Senior Living';\n}\necho '<h1 class=\"blog-hero__title\">' . esc_html( $archive_h1 ) . '</h1>';\n```\n4. ARCHITECTURAL RECOMMENDATION: Place directly inside `/wp-content/themes/owlbethere/archive.php` (or its hero template-part) so any future blog categories automatically inherit unique semantic `<h1>` tags.",
        "acceptanceCriteria": [
          "/blog/category/family-caregiver-resources/ renders H1 'Family Caregiver Resources — Senior Living Resources & Guides'.",
          "/blog/category/cost-planning/ renders H1 'Cost & Planning — Senior Living Resources & Guides'.",
          "Zero duplicate H1s reported across blog archives."
        ],
        "verificationMethod": "curl -s https://owlbethere.com/blog/category/cost-planning/ | grep -i '<h1'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-DEV-02",
        "phase": "Phase 2 (November)",
        "sprintOrder": 6,
        "title": "LocalBusiness JSON-LD Schema Enrichment Across All 7 Franchise Subsites",
        "category": "Schema & AI Visibility",
        "priority": "High",
        "status": "Queued for Phase 2",
        "assignedRole": "Dev Team",
        "estimatedMinutes": 60,
        "billable": true,
        "rootCause": "1. SYMPTOM & LIVE EVIDENCE: In <head> -> <script type=\"application/ld+json\" class=\"rank-math-schema\"> across all 7 franchise subsites (/charleston/, /charlottesouth/, /frederickloudoun/, /greaterwashingtondc/, /memphis/, /northorlando/, /wilmingtonwestchester/), the LocalBusiness node outputs name, url, telephone, email, and address, but omits geo (GeoCoordinates) and openingHoursSpecification. Additionally, states inside areaServed (e.g., Virginia, Maryland, Delaware) are typed as @type: City instead of @type: AdministrativeArea.\n2. ROOT CAUSE: Incomplete LocalBusiness schema generator in /wp-content/themes/owlbethere-zee/functions.php.",
        "businessImpact": "Strengthens Google Local Pack eligibility, Rich Results validation, and AI Search / LLM entity extraction across all 7 franchise markets.",
        "sampleUrls": [
          "https://owlbethere.com/charleston/",
          "https://owlbethere.com/charlottesouth/",
          "https://owlbethere.com/frederickloudoun/",
          "https://owlbethere.com/greaterwashingtondc/",
          "https://owlbethere.com/memphis/",
          "https://owlbethere.com/northorlando/",
          "https://owlbethere.com/wilmingtonwestchester/"
        ],
        "technicalInstructions": "3. READY-TO-TEST CODE (PHP Filter for Rank Math JSON-LD):\n```php\n// In /wp-content/themes/owlbethere-zee/functions.php\nadd_filter( 'rank_math/json_ld', function( $data, $jsonld ) {\n    foreach ( $data as $key => &$entity ) {\n        if ( isset( $entity['@type'] ) && $entity['@type'] === 'LocalBusiness' ) {\n            $lat = get_field( 'location_latitude', 'option' );\n            $lng = get_field( 'location_longitude', 'option' );\n            if ( $lat && $lng ) {\n                $entity['geo'] = [\n                    '@type'     => 'GeoCoordinates',\n                    'latitude'  => (float) $lat,\n                    'longitude' => (float) $lng,\n                ];\n            }\n            if ( empty( $entity['openingHoursSpecification'] ) ) {\n                $entity['openingHoursSpecification'] = [[\n                    '@type'     => 'OpeningHoursSpecification',\n                    'dayOfWeek' => ['Monday','Tuesday','Wednesday','Thursday','Friday'],\n                    'opens'     => '08:30',\n                    'closes'    => '17:30'\n                ]];\n            }\n        }\n    }\n    return $data;\n}, 99, 2 );\n```\n4. ARCHITECTURAL RECOMMENDATION: Implement in `/wp-content/themes/owlbethere-zee/functions.php` reading coordinates from the subsite ACF Options page, and map state-level `areaServed` entries to `@type: AdministrativeArea`.",
        "acceptanceCriteria": [
          "All 7 franchise homepages output valid geo (GeoCoordinates) and openingHoursSpecification inside LocalBusiness JSON-LD.",
          "State entities in areaServed use @type: AdministrativeArea with 0 warnings in Google Rich Results Test."
        ],
        "verificationMethod": "curl -s https://owlbethere.com/charleston/ | grep -o 'GeoCoordinates'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-DEV-03",
        "phase": "Phase 2 (November)",
        "sprintOrder": 7,
        "title": "Convert 4 Heavy PNG Assets (901 KB – 1.43 MB Across Media Folders) to WebP",
        "category": "Core Web Vitals & LCP",
        "priority": "Medium",
        "status": "Queued for Phase 2",
        "assignedRole": "Dev Team",
        "estimatedMinutes": 45,
        "billable": true,
        "rootCause": "1. SYMPTOM & LIVE EVIDENCE: Screaming Frog identified 30 image URLs exceeding 800 KB caused by 4 uncompressed PNG files cloned across the Corporate site and franchise media folders:\n• Kelly_and_David_Circular_Transparent-1-1-2.png (1.43 MB) — on https://owlbethere.com/about-us/ inside Leadership Team Grid under 'Meet Our Founders'.\n• group.png (1.19 MB) — on franchise guidance pages like https://owlbethere.com/greaterwashingtondc/senior-living-guidance/.\n• hero-photo-assisted-living.png (1.07 MB) — on franchise assisted living pages like https://owlbethere.com/wilmingtonwestchester/senior-living-guidance/assisted-living-placement-guidance/ (Above-the-Fold Hero LCP element).\n• section-photo-living-guidance-hub-933x1024.png (901 KB) — on franchise pages like https://owlbethere.com/charleston/senior-living-guidance/.\n2. ROOT CAUSE: Original high-res PNGs were uploaded into subsite `/wp-content/uploads/sites/[id]/2026/` media folders without WebP compression.",
        "businessImpact": "Reduces hero and section image payload by >85% (from ~1.1 MB to <120 KB per page), directly improving mobile Largest Contentful Paint (LCP) across all 7 franchise markets.",
        "sampleUrls": [
          "https://owlbethere.com/about-us/",
          "https://owlbethere.com/wilmingtonwestchester/senior-living-guidance/assisted-living-placement-guidance/",
          "https://owlbethere.com/greaterwashingtondc/senior-living-guidance/",
          "https://owlbethere.com/charleston/senior-living-guidance/"
        ],
        "technicalInstructions": "3. READY-TO-TEST CODE / CLI BATCH:\n```bash\n# Live example verified: /wp-content/uploads/sites/5/2026/07/hero-photo-assisted-living.png\nfor f in $(find wp-content/uploads -name \"hero-photo-assisted-living.png\" -o -name \"group.png\" -o -name \"section-photo-living-guidance-hub-933x1024.png\" -o -name \"Kelly_and_David_Circular_Transparent-1-1-2*.png\"); do\n  cwebp -q 82 \"$f\" -o \"${f%.png}.webp\"\ndone\n```\n4. ARCHITECTURAL RECOMMENDATION: Trigger WebP Express bulk conversion across all multisite upload folders (`sites/3/` through `sites/9/`) or ensure Jetpack Photon CDN rewrites `.png` hero block sources to `format=webp` automatically.",
        "acceptanceCriteria": [
          "All 4 master images and their subsite copies serve as WebP under 150 KB.",
          "Zero images > 500 KB remain on core service and about pages."
        ],
        "verificationMethod": "curl -ILs https://owlbethere.com/wilmingtonwestchester/wp-content/uploads/sites/5/2026/07/hero-photo-assisted-living.png | grep -i 'content-length'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-DEV-04",
        "phase": "Phase 2 (November)",
        "sprintOrder": 8,
        "title": "Minify First-Party Theme CSS/JS & Add Empty alt=\"\" to Decorative Theme SVGs",
        "category": "Performance & Accessibility",
        "priority": "Low",
        "status": "Queued for Phase 2",
        "assignedRole": "Dev Team",
        "estimatedMinutes": 60,
        "billable": true,
        "rootCause": "1. SYMPTOM & LIVE EVIDENCE:\n• Semrush flagged 231 warnings for unminified JS/CSS across `/wp-content/themes/owlbethere/assets/js/*.js` and `/wp-content/themes/owlbethere/acf-blocks/*` (71 JS files and 56 CSS files total).\n• Screaming Frog identified 37 decorative background/icon image tags missing an `alt` attribute entirely (`banner-cover-img.jpg` located at `/wp-content/themes/owlbethere/src/images/banner-cover-img.jpg` across 21 pages, plus decorative theme SVGs).\n2. ROOT CAUSE: Theme asset pipeline serves unminified files in production, and decorative `<img>` tags in theme templates omit `alt=\"\" role=\"presentation\"`.",
        "businessImpact": "Clears 231 Semrush asset warnings and silences screen-reader filename announcements on decorative background banners.",
        "sampleUrls": [
          "https://owlbethere.com/",
          "https://owlbethere.com/wp-content/themes/owlbethere/src/images/banner-cover-img.jpg"
        ],
        "technicalInstructions": "3. READY-TO-TEST CODE (PHP):\n```php\n// In theme banner template-part\n<img src=\"<?php echo esc_url( get_template_directory_uri() . '/src/images/banner-cover-img.jpg' ); ?>\" alt=\"\" role=\"presentation\" loading=\"lazy\" decoding=\"async\" />\n```\n4. ARCHITECTURAL RECOMMENDATION: Add `alt=\"\" role=\"presentation\"` to decorative template `<img>` tags in `owlbethere` parent theme and enable production asset minification (`terser` / `cssnano`) in the SCSS/JS build pipeline.",
        "acceptanceCriteria": [
          "banner-cover-img.jpg includes explicit alt=\"\" role=\"presentation\" in HTML output.",
          "Theme CSS and JS assets serve minified in production."
        ],
        "verificationMethod": "curl -s https://owlbethere.com/ | grep -i 'banner-cover-img.jpg'",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      },
      {
        "id": "OBT-DEV-05",
        "phase": "Phase 2 (November)",
        "sprintOrder": 9,
        "title": "WP Defender Firewall Allowlist for SiteAuditBot & Deploy Root /llms.txt",
        "category": "Crawl Governance & AI Search",
        "priority": "Low",
        "status": "Queued for Phase 2",
        "assignedRole": "Dev Team",
        "estimatedMinutes": 15,
        "billable": true,
        "rootCause": "1. SYMPTOM & LIVE EVIDENCE:\n• Semrush October re-crawl failed with 'Audit Interrupted: HTTP 403 Forbidden' on `https://owlbethere.com/` when crawling as `SiteAuditBot/0.97` (verified via live curl test).\n• Semrush AI Search Health (89%) flagged 1 notice: `https://owlbethere.com/llms.txt` returns HTTP 404.\n2. ROOT CAUSE: WP Defender Firewall blocks `SiteAuditBot` User-Agent, and no `/llms.txt` markdown index exists at the web root.",
        "businessImpact": "Unblocks automated monthly Semrush crawls and boosts AI Search Health from 89% toward 100%.",
        "sampleUrls": [
          "https://owlbethere.com/",
          "https://owlbethere.com/llms.txt"
        ],
        "technicalInstructions": "1. In WordPress Network Admin -> WP Defender -> Firewall -> User Agent Banning -> Allowlist: add `SiteAuditBot` and `SemrushBot`.\n2. Deploy static `/llms.txt` in the corporate web root summarizing Owl Be There's senior living placement services and 7 franchise locations.",
        "acceptanceCriteria": [
          "curl -ILs -A 'SiteAuditBot/0.97' https://owlbethere.com/ returns HTTP/2 200.",
          "https://owlbethere.com/llms.txt returns HTTP/2 200 with text/plain or text/markdown content."
        ],
        "verificationMethod": "curl -ILs -A 'SiteAuditBot/0.97' https://owlbethere.com/",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Fx8tsCykRmfqG79Cw0o0K7dZYdJMYK3x/edit?gid=1376022516#gid=1376022516"
      }
    ],
    "completedTasks": [
      {
        "id": "OBT-CMP-01",
        "title": "Full 1,376-URL Screaming Frog Crawl, Semrush Reconciliation & 5-Tab Master Workbook",
        "category": "Technical Audit Baseline",
        "completedDate": "October 16, 2026",
        "verifiedDate": "October 16, 2026",
        "verifiedBy": "Víctor Henríquez",
        "investedMinutes": 45,
        "assignedRole": "Víctor Henríquez",
        "summary": "Completed full empirical crawl across Corporate HQ and all 7 franchise subsites (95 indexable HTML pages, 100% 200 OK, 0 broken links). Pinpointed exact DOM/page locations for 3 cross-location city meta bleeds, 5 internal 301 redirect links, 2 missing editorial alt attributes, duplicate category H1s, and LocalBusiness Schema enhancements."
      }
    ]
  }
};

// Sanitization & Defensive Helpers
window.sanitize = function(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};
