/**
 * Bright Pink Agency - Technical SEO Audit Hub Data Store
 * Synchronized from canonical data/clients/*.json files.
 */

window.BPA_DATA = {
    "oh-deer": {
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
    "us-lawns": {
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
    "owl-be-there": {
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
    },
    "pacific-lawn-sprinklers": {
        "clientName": "Pacific Lawn Sprinklers",
        "clientSlug": "pacific-lawn-sprinklers",
        "domain": "pacificlawnsprinklers.com",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020",
        "gdocUrl": "https://docs.google.com/document/d/1uXIWLw67yXgxljBnEjvVMjzMHDkIZS8Vq5o_aUmY8eI/edit",
        "industry": "Residential & Commercial Irrigation, Lawn Sprinkler Systems & Landscape Lighting",
        "industry_en": "Residential & Commercial Irrigation, Lawn Sprinkler Systems & Landscape Lighting",
        "auditDate": "October 2026",
        "auditCycle": "Post-Launch Technical SEO Audit & Site Health Benchmark",
        "auditCycle_en": "Post-Launch Technical SEO Audit & Site Health Benchmark",
        "accountManager": "Gabriel Rojas",
        "technicalSeoLead": "Víctor Henríquez",
        "cmsStack": {
            "platform": "WordPress 7.1.3 (Gutenberg / ACF & SCSS)",
            "structure": "Corporate Hub + Regional Service Locations (/san-antonio-tx/, /tampa-fl/, etc.)",
            "hosting": "Cloudflare WAF + Fastly Edge CDN",
            "seoPlugin": "Rank Math SEO",
            "theme": "BPA Custom In-House Theme (bpa-pacific) with Gutenberg/ACF & Modular SCSS"
        },
        "kpis": {
            "totalCrawledUrls": 4052,
            "clean200HtmlPages": 4025,
            "indexableHtmlCount": 274,
            "internal301Redirects": 17,
            "broken404Pages": 9,
            "wafFalsePositive403": 0,
            "duplicateH1s": 16,
            "crawlDepthBreakdown": {
                "level1": 26,
                "level2": 72,
                "level3": 188,
                "level4Plus": 1
            },
            "healthScores": {
                "rawSemrushScore": 88,
                "calibratedTrueHealth": 98.2,
                "calibrationNote": "Semrush crawled only 428 pages and flagged 682 temporary 302 redirects due to Cloudflare WAF bot challenges. Live Screaming Frog deep crawl of 4,052 URLs proved 99.3% of the architecture (4,025 URLs) returns 200 OK, with exactly 17 permanent 301 redirects (15 legacy DotNetNuke links) and 9 isolated 404s (pagination and phone link tags).",
                "calibrationNote_en": "Semrush crawled only 428 pages and flagged 682 temporary 302 redirects due to Cloudflare WAF bot challenges. Live Screaming Frog deep crawl of 4,052 URLs proved 99.3% of the architecture (4,025 URLs) returns 200 OK, with exactly 17 permanent 301 redirects (15 legacy DotNetNuke links) and 9 isolated 404s (pagination and phone link tags)."
            }
        },
        "sprintSummary": {
            "totalEstimatedMinutes": 30,
            "totalEstimatedHours": "0.5 hrs",
            "billable": true,
            "approvalStatus": "Ready for AM Review (Gabriel Rojas)",
            "approvalStatus_en": "Ready for AM Review (Gabriel Rojas)",
            "budgetImpact": "Austere 30-min CMS Quick Sprint (0.5 hrs) — Resolves 4 missing location meta descriptions, fixes 3 malformed phone/web links, and adds 301 redirect for Wet-Check."
        },
        "tasks": [
            {
                "id": "PLS-SPRINT-01",
                "phase": "Current Sprint",
                "sprintOrder": 1,
                "title": "Add High-CTR Meta Descriptions on Location Landing Pages (San Antonio & Tampa)",
                "category": "Local SEO & Metadata",
                "priority": "High",
                "status": "Ready for CMS Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 10,
                "billable": true,
                "rootCause": "WHERE ON PAGE / DOM: <head> -> <meta name=\"description\">. Core regional franchise location pages /san-antonio-tx/ and /tampa-fl/ are missing meta descriptions entirely, forcing Google to generate dynamic snippets.",
                "businessImpact": "Improves local search organic CTR and prevents random page fragment text from appearing in competitive San Antonio and Tampa search results.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/san-antonio-tx/",
                    "https://www.pacificlawnsprinklers.com/tampa-fl/"
                ],
                "technicalInstructions": "1. In WordPress Admin -> Pages -> Edit 'San Antonio, TX' -> Rank Math Meta Box -> Description:\n   'Professional lawn sprinkler and irrigation services in San Antonio, TX. Pacific Lawn Sprinklers offers repairs, installations, and seasonal maintenance. Call today!' (153 chars)\n2. Edit 'Tampa, FL' -> Rank Math Meta Box -> Description:\n   'Top-rated lawn sprinkler installation, repair, and landscape lighting in Tampa, FL. Count on Pacific Lawn Sprinklers for reliable, eco-friendly irrigation services.' (154 chars)",
                "acceptanceCriteria": [
                    "Both location URLs output verified custom meta description tags in DOM.",
                    "Character length remains under 155 characters."
                ],
                "verificationMethod": "curl -s https://www.pacificlawnsprinklers.com/san-antonio-tx/ | grep -i 'meta name=\"description\"'",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-SPRINT-02",
                "phase": "Current Sprint",
                "sprintOrder": 2,
                "title": "Fix Malformed Relative Telephone Links (href=\"/tel:...\")",
                "category": "Crawl Budget & 404 Resolution",
                "priority": "High",
                "status": "Ready for CMS Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 10,
                "billable": true,
                "rootCause": "WHERE ON PAGE / DOM: Hardcoded telephone links containing leading slashes: href=\"/tel:888-438-7224\" (2 inlinks) and href=\"/tel:8884387224\" (3 inlinks). Web browsers and search crawlers resolve these as relative paths on the domain, producing 404 errors.",
                "businessImpact": "Eliminates 5 internal 404 errors and ensures mobile click-to-call triggers the native phone dialer immediately for prospective customers.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/tel:888-438-7224",
                    "https://www.pacificlawnsprinklers.com/tel:8884387224"
                ],
                "technicalInstructions": "Search post content and header/footer widgets for '/tel:' and remove the leading slash so links read strictly: href=\"tel:888-438-7224\" and href=\"tel:8884387224\".",
                "acceptanceCriteria": [
                    "All telephone anchors in DOM output valid tel: URI scheme without leading slash.",
                    "Crawler encounters zero 404 errors on telephone strings."
                ],
                "verificationMethod": "Inspect page source for href=\"tel:888-438-7224\"",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-SPRINT-03",
                "phase": "Current Sprint",
                "sprintOrder": 3,
                "title": "Implement 301 Permanent Redirect for Legacy Wet-Check Page",
                "category": "Redirect Mapping",
                "priority": "High",
                "status": "Ready for CMS Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 5,
                "billable": true,
                "rootCause": "WHERE ON PAGE / DOM: Legacy DotNetNuke URL /Services/Lawn-Sprinkler-Systems/Inspection-Wet-Check is linked in internal post content (2 inlinks) but returns HTTP 404 because no 301 redirect rule was established during migration.",
                "businessImpact": "Recovers internal link equity and directs visitors searching for wet-check inspections to the modern active service category.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/Services/Lawn-Sprinkler-Systems/Inspection-Wet-Check"
                ],
                "technicalInstructions": "In WordPress Admin -> Rank Math -> Redirections -> Add New:\n- Source URL: /Services/Lawn-Sprinkler-Systems/Inspection-Wet-Check\n- Destination URL: https://www.pacificlawnsprinklers.com/services/lawn-sprinkler-systems/\n- Redirection Type: 301 Permanent Move",
                "acceptanceCriteria": [
                    "curl -ILs returns HTTP 301 redirect to https://www.pacificlawnsprinklers.com/services/lawn-sprinkler-systems/"
                ],
                "verificationMethod": "curl -ILs 'https://www.pacificlawnsprinklers.com/Services/Lawn-Sprinkler-Systems/Inspection-Wet-Check' | grep -i 'HTTP/'",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-SPRINT-04",
                "phase": "Current Sprint",
                "sprintOrder": 4,
                "title": "Fix Malformed External Link (href=\"www.pacificlawnsprinklers.com\")",
                "category": "Crawl Budget & 404 Resolution",
                "priority": "Medium",
                "status": "Ready for CMS Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 5,
                "billable": true,
                "rootCause": "WHERE ON PAGE / DOM: In-content link written as href=\"www.pacificlawnsprinklers.com\" missing the https:// protocol scheme, causing the browser to append it to the current path and return 404.",
                "businessImpact": "Cleans up internal broken link and ensures users navigating to homepage reach 200 OK cleanly.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/www.pacificlawnsprinklers.com"
                ],
                "technicalInstructions": "Locate the affected post content via inlinks and update anchor href from 'www.pacificlawnsprinklers.com' to 'https://www.pacificlawnsprinklers.com/'.",
                "acceptanceCriteria": [
                    "Link points to absolute https:// URL with 200 OK."
                ],
                "verificationMethod": "Verify href attribute in post HTML",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-DEV-01",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 5,
                "title": "Fix Critical Canonical Tag Override on Corporate Form (/pls-corporate-form/)",
                "category": "Canonical Architecture",
                "priority": "Critical",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 15,
                "billable": true,
                "rootCause": "1. SYMPTOM & EVIDENCE: https://www.pacificlawnsprinklers.com/pls-corporate-form/ outputs <link rel=\"canonical\" href=\"https://www.pacificlawnsprinklers.com/about/blog/\">.\n2. ROOT CAUSE: Hardcoded canonical override in post meta or template-parts/pls-corporate.php instructing Google to index blog index instead of form.",
                "businessImpact": "Prevents catastrophic canonical mismatch where Google de-indexes the corporate customer intake form.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/pls-corporate-form/"
                ],
                "technicalInstructions": "Clear custom canonical field in Rank Math page meta or remove manual rel=\"canonical\" output in theme template, restoring standard wp_get_canonical_url().",
                "acceptanceCriteria": [
                    "Canonical tag on /pls-corporate-form/ matches self: https://www.pacificlawnsprinklers.com/pls-corporate-form/"
                ],
                "verificationMethod": "curl -s https://www.pacificlawnsprinklers.com/pls-corporate-form/ | grep -i 'canonical'",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-DEV-02",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 6,
                "title": "Fix Blog Archive Pagination 404 Loops (/page/5/ & ?cat=14)",
                "category": "Theme Templates & Pagination",
                "priority": "High",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 30,
                "billable": true,
                "rootCause": "1. SYMPTOM & EVIDENCE: /about/blog/page/5/ and /about/blog/page/4/?cat=14 return 404 Not Found, but are linked by archive pagination buttons.\n2. ROOT CAUSE: Custom pagination helper uses global post count rather than filtered taxonomy term query, generating links to pages that have zero posts.",
                "businessImpact": "Eliminates 9 inlinks pointing to broken 404 archive pages, protecting search crawler crawl budget.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/about/blog/page/5/",
                    "https://www.pacificlawnsprinklers.com/about/blog/page/4/?cat=14"
                ],
                "technicalInstructions": "Update archive-blog.php pagination logic to respect $query->max_num_pages:\n$paged = (get_query_var('paged')) ? get_query_var('paged') : 1;\necho paginate_links(['total' => $blog_query->max_num_pages, 'current' => $paged]);",
                "acceptanceCriteria": [
                    "Pagination controls never render page links beyond $blog_query->max_num_pages.",
                    "Zero 404 responses encountered on pagination links."
                ],
                "verificationMethod": "curl -ILs https://www.pacificlawnsprinklers.com/about/blog/page/4/ | grep -i 'page/5/'",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-DEV-03",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 7,
                "title": "Replace 17 Internal DotNetNuke Redirect Links in Theme Templates",
                "category": "Crawl Budget & Redirect Hops",
                "priority": "High",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 30,
                "billable": true,
                "rootCause": "1. SYMPTOM & EVIDENCE: 17 internal links trigger 301 redirects to lowercase/modern slugs (e.g. /About-Us/Company-Info -> /about/ with 11 inlinks).\n2. ROOT CAUSE: Hardcoded legacy DotNetNuke URLs in navigation menus, footer widgets, and Gutenberg template parts.",
                "businessImpact": "Eliminates 17 internal redirect hops across the site, speeding up navigation and preserving link equity.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/About-Us/Company-Info",
                    "https://www.pacificlawnsprinklers.com/Services/Lawn-Sprinkler-Systems/Spring-Start-Ups",
                    "https://www.pacificlawnsprinklers.com/Services/Lawn-Sprinkler-Systems/WIFI-Controllers"
                ],
                "technicalInstructions": "1. Update Appearance > Menus to modern lowercase slugs.\n2. Execute WP-CLI search-replace across wp_posts:\nwp search-replace '/About-Us/Company-Info' '/about/' --dry-run\nwp search-replace '/Services/Lawn-Sprinkler-Systems/' '/services/lawn-sprinkler-systems/' --dry-run",
                "acceptanceCriteria": [
                    "All navigation menus and footer widgets link directly to canonical 200 OK URLs."
                ],
                "verificationMethod": "Verify menu HTML source code for modern lowercase slugs",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-DEV-04",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 8,
                "title": "Dynamic Heading (H1) and Title on Blog Taxonomy Archives",
                "category": "Heading Hierarchy & On-Page SEO",
                "priority": "Medium",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 15,
                "billable": true,
                "rootCause": "1. SYMPTOM & EVIDENCE: 16 blog category pagination pages duplicate the exact same Title and H1: 'Outdoor Service Tips & Pacific Lawn Sprinklers News'.\n2. ROOT CAUSE: archive-blog.php hardcodes static blog title instead of querying single_cat_title().",
                "businessImpact": "Eliminates duplicate H1 tags across 16 category pages and establishes proper semantic heading hierarchy.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/about/blog/?cat=1",
                    "https://www.pacificlawnsprinklers.com/about/blog/?cat=14"
                ],
                "technicalInstructions": "In archive-blog.php:\n<?php if (is_category()) : ?>\n  <h1><?php single_cat_title(); ?> — Tips & News</h1>\n<?php else : ?>\n  <h1>Outdoor Service Tips & Pacific Lawn Sprinklers News</h1>\n<?php endif; ?>",
                "acceptanceCriteria": [
                    "Category archive pages output dynamic H1 including category name."
                ],
                "verificationMethod": "curl -s 'https://www.pacificlawnsprinklers.com/about/blog/?cat=14' | grep -i '<h1'",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            },
            {
                "id": "PLS-CNT-01",
                "phase": "Phase 2 (Content)",
                "sprintOrder": 9,
                "title": "Trim 29 Page Titles Exceeding 60 Characters & Replace Legacy Blog Asset",
                "category": "Content & Metadata",
                "priority": "Low",
                "status": "Queued for Content Sprint",
                "assignedRole": "Content Team",
                "estimatedMinutes": 60,
                "billable": true,
                "rootCause": "29 page titles truncate in SERPs due to site title suffix ' | Pacific Lawn Sprinklers', and 1 legacy 2017 blog post references a missing DotNetNuke rotator thumbnail (/Portals/0/EasyDNNRotator/2680/thumb/thumb_neigj02k.jpg).",
                "businessImpact": "Polishes search snippet display and eliminates broken thumbnail reference on legacy content.",
                "sampleUrls": [
                    "https://www.pacificlawnsprinklers.com/about/blog/how-to-winterize-a-sprinkler-system/"
                ],
                "technicalInstructions": "1. Review 29 titles identified in Master Workbook Tab 'Immediate Actions' and adjust character counts under 60 chars.\n2. In 2017 blog post, remove broken <img> tag or replace with high-resolution image asset.",
                "acceptanceCriteria": [
                    "Targeted page titles render without truncation in SERP simulators.",
                    "Broken image call removed from post HTML."
                ],
                "verificationMethod": "Inspect page title lengths in Screaming Frog",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1Jn1AcZ_sFECwyvqSWknHTuIba3tY26gk/edit?gid=76618020#gid=76618020"
            }
        ],
        "completedTasks": [
            {
                "id": "PLS-CMP-01",
                "title": "Full 4,052-URL Screaming Frog Deep Crawl, Semrush Reconciliation & 5-Tab Master Technical SEO Workbook",
                "category": "Technical Audit Baseline",
                "completedDate": "October 16, 2026",
                "verifiedDate": "October 16, 2026",
                "verifiedBy": "Víctor Henríquez",
                "investedMinutes": 45,
                "assignedRole": "Víctor Henríquez",
                "summary": "Completed full empirical crawl across Pacific Lawn Sprinklers architecture (4,052 URLs, 99.3% 200 OK). Reconciled Semrush crawler limitations, debunked 682 temporary 302 redirects as Cloudflare WAF bot-challenge false positives, identified 1 critical canonical bug (/pls-corporate-form/), mapped all 17 permanent 301 redirects, and isolated exact root causes for all 9 404 URLs."
            }
        ]
    },
    "image-studios": {
        "clientName": "IMAGE Studios",
        "clientSlug": "image-studios",
        "domain": "imagestudios.co",
        "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
        "gdocUrl": "https://docs.google.com/document/d/1_IumZ4vcxTsEaE98rOXflP2eCACOhcsxzFmOVKtwdWI/edit?tab=t.0",
        "industry": "Luxury Salon Suite Rental Franchise Network (150+ US Locations & 3,000+ Pros)",
        "industry_en": "Luxury Salon Suite Rental Franchise Network (150+ US Locations & 3,000+ Pros)",
        "auditDate": "October 2026",
        "auditCycle": "Post-Migration Technical SEO QA & 4-Month Phased Retainer Roadmap (15.0h Oct Budget)",
        "auditCycle_en": "Post-Migration Technical SEO QA & 4-Month Phased Retainer Roadmap (15.0h Oct Budget)",
        "accountManager": "Ruben Garcia",
        "technicalSeoLead": "Víctor Henríquez",
        "cmsStack": {
            "platform": "WordPress Custom CPT Architecture (studio_locations, pros, bios)",
            "structure": "Corporate Commercial Hubs + 153 Location Pages + 2,862 Salon Pro Profiles (/pros/*) + Franchise Owner Bios (/bios/*)",
            "hosting": "Nginx Web Server + Google Tag Manager (GTM-P2WKVLD)",
            "seoPlugin": "Yoast SEO + Custom JSON-LD Header Injection",
            "theme": "IMAGE Studios Custom In-House Theme (image-studios v1.0.0 based on Underscores _s)"
        },
        "kpis": {
            "totalCrawledUrls": 7066,
            "clean200HtmlPages": 3580,
            "indexableHtmlCount": 3251,
            "internal301Redirects": 3216,
            "broken404Pages": 1,
            "wafFalsePositive403": 0,
            "duplicateH1s": 100,
            "crawlDepthBreakdown": {
                "level1": 18,
                "level2": 240,
                "level3": 3120,
                "level4Plus": 202
            },
            "healthScores": {
                "rawSemrushScore": 84,
                "calibratedTrueHealth": 94.5,
                "calibrationNote": "Screaming Frog deep crawl of 7,066 URLs across imagestudios.co confirmed 0 broken internal links and 100% live deployment of core Schema.org blocks (Organization, ProfessionalService, Service, FAQPage, CollectionPage, ItemList, ProfilePage, Person, BreadcrumbList). 319 'Canonicalised' URLs were verified as clean query parameter filters on /look-for-a-salon-pro/, and 10 'Noindex' URLs were verified as Yoast XML sitemaps. 3,216 internal 301 redirects stem from 3 PHP template link helpers omitting trailing slashes (/pros/, /bios/, and location links).",
                "calibrationNote_en": "Screaming Frog deep crawl of 7,066 URLs across imagestudios.co confirmed 0 broken internal links and 100% live deployment of core Schema.org blocks (Organization, ProfessionalService, Service, FAQPage, CollectionPage, ItemList, ProfilePage, Person, BreadcrumbList). 319 'Canonicalised' URLs were verified as clean query parameter filters on /look-for-a-salon-pro/, and 10 'Noindex' URLs were verified as Yoast XML sitemaps. 3,216 internal 301 redirects stem from 3 PHP template link helpers omitting trailing slashes (/pros/, /bios/, and location links)."
            }
        },
        "sprintSummary": {
            "totalEstimatedMinutes": 420,
            "totalEstimatedHours": "7.0 hrs Active + 2.5 hrs Completed QA",
            "billable": true,
            "approvalStatus": "Aligned with Ruben Garcia (AM) & Florin Chiriac (Dev)",
            "approvalStatus_en": "Aligned with Ruben Garcia (AM) & Florin Chiriac (Dev)",
            "budgetImpact": "October Retainer Budget: 15.0 Hours (10.0h Base + 5.0h Carry-Over). 26 Roadmap items resolved in Month 1: 10 closed via live QA (0 dev hours) + 12 resolved via 5 surgical PHP template tickets (Florin) + 4 GA4/Reporting tasks, leaving 3.5 hrs strategic buffer."
        },
        "tasks": [
            {
                "id": "IMG-SPRINT-01",
                "phase": "Current Sprint",
                "sprintOrder": 1,
                "title": "GA4 Conversion Event Cleanup, Direct/Unassigned Attribution & AI Regex Filter (NEW-03, NEW-04, NEW-08)",
                "title_en": "GA4 Conversion Event Cleanup, Direct/Unassigned Attribution & AI Regex Filter (NEW-03, NEW-04, NEW-08)",
                "category": "Analytics & Attribution (GA4)",
                "priority": "High",
                "status": "Ready for Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 90,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar3n",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Consolidation Impact: Resolves 3 ClickUp Subtasks (NEW-03, NEW-04 & NEW-08). Directory zip searches (?zipSearch=...) currently trigger lead conversion events, skewing salon suite inquiry data. In addition, AI search traffic lacks a dedicated channel group, and cross-domain tracking has gaps causing direct/unassigned attribution.",
                "businessImpact": "Gives Ruben Garcia accurate salon suite lead conversion figures for client reporting and introduces clean segmentation for incoming AI traffic (ChatGPT, Perplexity, Claude, Gemini).",
                "sampleUrls": [
                    "https://imagestudios.co/open-your-salon/",
                    "https://imagestudios.co/look-for-a-salon-pro/"
                ],
                "technicalInstructions": "1. In GA4 Admin -> Events & Key Events: Ensure pro directory search queries do not fire primary lead conversion events.\n2. In GTM-P2WKVLD: Audit cross-domain and referral exclusions to minimize Unassigned sessions.\n3. Add AI Traffic Channel Group with regex: chatgpt\\.com|perplexity\\.ai|claude\\.ai|gemini\\.google\\.com|copilot\\.microsoft\\.com.",
                "acceptanceCriteria": [
                    "Directory zip-code searches no longer inflate lead conversion metrics.",
                    "AI referral traffic channel validates cleanly in GA4 Explorations."
                ],
                "verificationMethod": "Verify live in GA4 DebugView and Realtime conversion stream"
            },
            {
                "id": "IMG-SPRINT-02",
                "phase": "Current Sprint",
                "sprintOrder": 2,
                "title": "Commercial Hub Title/Meta CTR Optimization & Desktop vs. Mobile CTR Audit (Item 13.0, NEW-05, NEW-12)",
                "title_en": "Commercial Hub Title/Meta CTR Optimization & Desktop vs. Mobile CTR Audit (Item 13.0, NEW-05, NEW-12)",
                "category": "On-Page SEO & SERP CTR",
                "priority": "High",
                "status": "Ready for Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 60,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar3r",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Consolidation Impact: Resolves 3 ClickUp Subtasks (Item 13.0, NEW-05 & NEW-12). High-intent commercial pages (/open-your-salon/, /locations/, /studio-tour/, /look-for-a-salon-pro/) need CTR benchmarking by device in Google Search Console to capture maximum renter inquiries.",
                "businessImpact": "Increases organic click-through rate for high-value queries ('salon suites for rent', 'rent a salon suite') across mobile and desktop search results.",
                "sampleUrls": [
                    "https://imagestudios.co/open-your-salon/",
                    "https://imagestudios.co/studio-tour/",
                    "https://imagestudios.co/locations/",
                    "https://imagestudios.co/look-for-a-salon-pro/"
                ],
                "technicalInstructions": "1. Export 90-day GSC Desktop vs. Mobile CTR breakdown for commercial hub queries.\n2. Benchmark mobile vs. desktop click-through behavior.\n3. Refine Yoast SEO titles (<60 chars) and meta descriptions (<155 chars) where mobile CTR lags behind desktop.",
                "acceptanceCriteria": [
                    "All 4 commercial hubs have verified pixel-safe titles and meta descriptions.",
                    "Desktop vs. Mobile CTR findings documented for October reporting."
                ],
                "verificationMethod": "curl -s https://imagestudios.co/open-your-salon/ | grep -iE '<title|meta name=\"description\"'"
            },
            {
                "id": "IMG-SPRINT-03",
                "phase": "Current Sprint",
                "sprintOrder": 3,
                "title": "Compile Validated October Raw Report (Proof of Work + Proof of Value YoY) for Ruben's Client Deck",
                "title_en": "Compile Validated October Raw Report (Proof of Work + Proof of Value YoY) for Ruben's Client Deck",
                "category": "Executive Monthly Reporting",
                "priority": "High",
                "status": "Ready for Execution",
                "assignedRole": "Víctor Henríquez",
                "estimatedMinutes": 90,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar3d",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 BPA Lifecycle Standard (Rule 18): Technical SEO delivers validated raw data (GSC, GA4, Semrush, GBP) and technical proof so Account Manager Ruben Garcia can create an executive client slide deck with complete confidence.",
                "businessImpact": "Arms Ruben Garcia with undeniable Proof of Work (26 roadmap tasks resolved/closed in Month 1) and Proof of Value (YoY organic growth) to secure long-term client retention.",
                "sampleUrls": [
                    "https://imagestudios.co/"
                ],
                "technicalInstructions": "1. Consolidate October QA closure log (10 items verified live) + 5 Dev Ticket specs.\n2. Extract YoY & MoM Google Search Console Clicks, Impressions, CTR, and Average Position + GA4 Organic Sessions & Key Events.\n3. Deliver structured Raw Report to Ruben Garcia and execute bidirectional QA on draft presentation slides.",
                "acceptanceCriteria": [
                    "Raw Report delivered to Ruben Garcia ahead of client stakeholder presentation.",
                    "Draft presentation slides QA-verified for 100% technical accuracy."
                ],
                "verificationMethod": "Bidirectional review with Account Manager Ruben Garcia"
            },
            {
                "id": "IMG-DEV-01",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 4,
                "title": "Replace Corrupted /llms.txt Static File in Web Root (NEW-01 / Item 4.0)",
                "title_en": "Replace Corrupted /llms.txt Static File in Web Root (NEW-01 / Item 4.0)",
                "category": "AI Search & Technical Files",
                "priority": "High",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 15,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar3k",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Dev Ticket Standard: 1. SYMPTOM: https://imagestudios.co/llms.txt outputs malformed URLs with stripped colons/slashes ('httpsimagestudios360.com') and references the 404 path /suite-rentals. 2. ROOT CAUSE: Regex stripped punctuation during file creation. 3. ARCHITECTURE: Static text file in WordPress web root.",
                "businessImpact": "Restores clean AI crawler discovery directives (ChatGPT, Perplexity, Google AI Overviews) pointing to canonical https://imagestudios.co/ commercial hubs.",
                "sampleUrls": [
                    "https://imagestudios.co/llms.txt"
                ],
                "technicalInstructions": "Replace /llms.txt in the WordPress public root directory with the validated file:\n\n# IMAGE Studios LLMs.txt\nsite_name: IMAGE Studios\nsite_url: https://imagestudios.co/\nsite_type: Salon Suite Rental Franchise Network\n\npreferred_content:\n  - https://imagestudios.co/\n  - https://imagestudios.co/open-your-salon/\n  - https://imagestudios.co/locations/\n  - https://imagestudios.co/studio-tour/\n  - https://imagestudios.co/blog/\n  - https://imagestudios.co/look-for-a-salon-pro/",
                "acceptanceCriteria": [
                    "https://imagestudios.co/llms.txt returns HTTP 200 OK with properly formatted https://imagestudios.co/ URLs.",
                    "Zero references to imagestudios360.com or /suite-rentals remain."
                ],
                "verificationMethod": "curl -s https://imagestudios.co/llms.txt"
            },
            {
                "id": "IMG-DEV-02",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 5,
                "title": "Remove Self-Referencing Domain from Organization Schema sameAs Array (Item 3.0 & NEW-02)",
                "title_en": "Remove Self-Referencing Domain from Organization Schema sameAs Array (Item 3.0 & NEW-02)",
                "category": "Structured Data (Schema.org)",
                "priority": "Medium",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 15,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar3j",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Dev Ticket Standard: 1. SYMPTOM: On https://imagestudios.co/, the Organization JSON-LD block includes 'https://imagestudios.co/' as the 7th element inside its own sameAs array. 2. ROOT CAUSE: Root domain URL was appended to the social profile array. 3. ARCHITECTURE: Schema generator in theme helper functions.",
                "businessImpact": "Eliminates self-referential entity loops in Knowledge Graph signals while preserving all 6 verified external social and GBP authority profiles.",
                "sampleUrls": [
                    "https://imagestudios.co/"
                ],
                "technicalInstructions": "In /wp-content/themes/image-studios/functions.php (or header schema partial), update the Organization 'sameAs' array to strictly keep the 6 external profiles:\n\n\"sameAs\": [\n  \"https://share.google/Ad9ITCitItLAEOL7d\",\n  \"https://www.linkedin.com/company/image-studios-360\",\n  \"https://www.facebook.com/imagestudios360/\",\n  \"https://www.instagram.com/imagestudioshq/\",\n  \"https://www.youtube.com/channel/UC3PvOBRR81hHeRxLUDW19hQ/videos\",\n  \"https://www.pinterest.com/imagestudioshq/\"\n]",
                "acceptanceCriteria": [
                    "Organization JSON-LD sameAs array contains only the 6 external profile URLs.",
                    "Schema validates with 0 warnings in validator.schema.org."
                ],
                "verificationMethod": "curl -s https://imagestudios.co/ | grep -A 10 '\"sameAs\"'"
            },
            {
                "id": "IMG-DEV-03",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 6,
                "title": "301 Redirect /suite-rentals/ to /open-your-salon/ + Fix 3,216 Missing Trailing-Slash Template Links (NEW-10, Item 36.0, NEW-06)",
                "title_en": "301 Redirect /suite-rentals/ to /open-your-salon/ + Fix 3,216 Missing Trailing-Slash Template Links (NEW-10, Item 36.0, NEW-06)",
                "category": "Crawl Budget & Redirect Hops",
                "priority": "Critical",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 45,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar41",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Dev Ticket Standard: 1. SYMPTOM: (A) https://imagestudios.co/suite-rentals/ returns 404. (B) Screaming Frog flagged 3,216 internal 301 redirects (45.5% of site): 2,862 /pros/ links and 354 /bios/ links missing trailing slashes. 2. ROOT CAUSE: Missing server rewrite and template link helpers omit trailingslashit(). 3. ARCHITECTURE: Nginx rewrite + CPT single templates.",
                "businessImpact": "Recovers organic equity on the legacy commercial URL /suite-rentals/ and eliminates 3,216 internal 301 redirect hops in one quick template deployment.",
                "sampleUrls": [
                    "https://imagestudios.co/suite-rentals/",
                    "https://imagestudios.co/pros/lauryn-howland",
                    "https://imagestudios.co/bios/jessica-hutson",
                    "https://imagestudios.co/la-grange-il"
                ],
                "technicalInstructions": "1. In Nginx / Yoast Redirects, add permanent 301 redirect:\n   rewrite ^/suite-rentals/?$ https://imagestudios.co/open-your-salon/ permanent;\n2. In /wp-content/themes/image-studios/ templates (single-studio_locations.php, page-locations.php), wrap dynamic profile and location links in trailingslashit():\n   <a href=\"<?php echo esc_url( trailingslashit( $pro_url ) ); ?>\">",
                "acceptanceCriteria": [
                    "https://imagestudios.co/suite-rentals/ returns HTTP 301 -> https://imagestudios.co/open-your-salon/ (200 OK).",
                    "All /pros/, /bios/, and location links in DOM include a trailing slash (/)."
                ],
                "verificationMethod": "curl -ILs https://imagestudios.co/suite-rentals/ | head -n 15"
            },
            {
                "id": "IMG-DEV-04",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 7,
                "title": "Semantic Heading Hierarchy Upgrade (H4 to H2) on /pros/ and /locations/ Templates (Item 17.0)",
                "title_en": "Semantic Heading Hierarchy Upgrade (H4 to H2) on /pros/ and /locations/ Templates (Item 17.0)",
                "category": "Heading Hierarchy & On-Page SEO",
                "priority": "High",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 45,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar3m",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Dev Ticket Standard: 1. SYMPTOM: On /pros/* (2,862 pages), 'Services' and 'Availability' use <h4> skipping H2/H3. On /locations/, the page has 0 <h2> tags and wraps 30+ US States in <h4> directly under <h1>. 2. ROOT CAUSE: Templates used <h4> for visual font size rather than semantic structure. 3. ARCHITECTURE: CPT templates in child theme.",
                "businessImpact": "Restores strict H1 -> H2 semantic document outline across 2,862 Salon Pro pages and the core /locations/ directory hub with zero visual style breakage.",
                "sampleUrls": [
                    "https://imagestudios.co/pros/kiran-y-gurung/",
                    "https://imagestudios.co/locations/"
                ],
                "technicalInstructions": "1. In single-pros.php: Change <h4>Services</h4> and <h4>Availability</h4> to <h2 class=\"pro-section-heading\">Services</h2> and <h2 class=\"pro-section-heading\">Availability</h2>.\n2. In page-locations.php: Change state group headings from <h4><?php echo esc_html($state); ?></h4> to <h2 class=\"state-heading\"><?php echo esc_html($state); ?></h2> while preserving CSS classes.",
                "acceptanceCriteria": [
                    "Services and Availability render as <h2> across all /pros/* pages.",
                    "US State headings render as <h2> on /locations/."
                ],
                "verificationMethod": "curl -s https://imagestudios.co/pros/kiran-y-gurung/ | grep -iE '<h[1-4]'"
            },
            {
                "id": "IMG-DEV-05",
                "phase": "Phase 2 (Dev Backlog)",
                "sprintOrder": 8,
                "title": "Dynamic Yoast Filters for /pros/ & Multi-Studio City Titles, Fallback Meta Descriptions & Image Attributes (Items 15, 18, 23, 27, NEW-11)",
                "title_en": "Dynamic Yoast Filters for /pros/ & Multi-Studio City Titles, Fallback Meta Descriptions & Image Attributes (Items 15, 18, 23, 27, NEW-11)",
                "category": "Dynamic Templates & Metadata",
                "priority": "High",
                "status": "Ready for Dev Execution",
                "assignedRole": "Dev Team",
                "estimatedMinutes": 60,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar43",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Dev Ticket Standard: 1. SYMPTOM: 239 duplicate <title> tags and 862 short titles across /pros/* and multi-studio cities (San Antonio 3x, Dallas 3x, Austin 3x), plus 905 missing meta descriptions on /pros/* and 165 images missing dimensions. 2. ROOT CAUSE: Templates lack disambiguating variables and fallback meta description logic. 3. ARCHITECTURE: Yoast SEO filters in functions.php.",
                "businessImpact": "Eliminates 239 duplicate titles, 862 short titles, and 905 missing meta descriptions in a single functions.php deployment.",
                "sampleUrls": [
                    "https://imagestudios.co/pros/hello-sugar-4/",
                    "https://imagestudios.co/stone-oak-tx/",
                    "https://imagestudios.co/dallas-preston-plaza-tx/",
                    "https://imagestudios.co/pros/kaitlin-kirsner/"
                ],
                "technicalInstructions": "Add wpseo_title and wpseo_metadesc filters in /wp-content/themes/image-studios/functions.php:\n1. For singular 'pros': Output '[Pro Name] – [Business Name] ([City, ST]) | IMAGE Studios' and fallback meta description when bio is empty.\n2. For singular 'studio_locations': Output 'Salon Suites for Rent in [Branch Name] ([City, ST]) | IMAGE Studios'.\n3. Add fallback alt='[Branch Name] Salon Suite Studio' and width/height attributes on gallery <img> tags.",
                "acceptanceCriteria": [
                    "0 duplicate titles across /pros/* and multi-studio cities (San Antonio, Dallas, Austin).",
                    "0 empty meta descriptions across all 2,862 /pros/* profiles."
                ],
                "verificationMethod": "curl -s https://imagestudios.co/pros/kaitlin-kirsner/ | grep -i 'meta name=\"description\"'"
            },
            {
                "id": "IMG-CNT-01",
                "phase": "Phase 2 (Content)",
                "sprintOrder": 9,
                "title": "Answer-First Commercial Copy, Salon Suite Cost FAQ Hub & Blog Content Overhaul (Items 29, 30, 31, 32, 33)",
                "title_en": "Answer-First Commercial Copy, Salon Suite Cost FAQ Hub & Blog Content Overhaul (Items 29, 30, 31, 32, 33)",
                "category": "Content & AIO Strategy (Months 2–4)",
                "priority": "Medium",
                "status": "Scheduled in 4-Month Roadmap",
                "assignedRole": "Content Team",
                "estimatedMinutes": 180,
                "billable": true,
                "clickupUrl": "https://app.clickup.com/t/868mdar4a",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "rootCause": "🎯 Roadmap Phasing Principle (Rule 19): Long-term editorial and AI Overview (AIO) expansion items from the 52-task post-migration backlog scheduled across Months 2–4 to protect October retainer hours.",
                "businessImpact": "Expands non-branded renter-intent topical authority ('salon suite rental cost', 'booth rental vs suite rental') and AI Overview citation footprint across Months 2–4.",
                "sampleUrls": [
                    "https://imagestudios.co/open-your-salon/",
                    "https://imagestudios.co/blog/"
                ],
                "technicalInstructions": "Phased across Months 2–4 of the Retainer Roadmap:\n1. Rewrite /open-your-salon/ intro with Answer-First AIO copy (Item 29.0).\n2. Draft Dedicated Salon Suite Rental Cost FAQ page (Item 30.0) & Booth vs. Suite educational guide (Item 33.0).\n3. Execute blog consolidation and renter-intent refresh across priority blog posts (Item 32.0).",
                "acceptanceCriteria": [
                    "Editorial drafts approved by IMAGE Studios stakeholders prior to staging publication."
                ],
                "verificationMethod": "Editorial QA and Rich Results validation upon publication"
            }
        ],
        "completedTasks": [
            {
                "id": "IMG-CMP-01",
                "title": "Post-Migration Canonical Tag Verification Across 319 Dynamic Search Filter URLs (Items 2.0 & 28.0)",
                "title_en": "Post-Migration Canonical Tag Verification Across 319 Dynamic Search Filter URLs (Items 2.0 & 28.0)",
                "category": "Canonical & Indexation QA",
                "completedDate": "October 19, 2026",
                "verifiedDate": "October 19, 2026",
                "verifiedBy": "Víctor Henríquez",
                "investedMinutes": 45,
                "assignedRole": "Víctor Henríquez",
                "clickupUrl": "https://app.clickup.com/t/868mdar49",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "summary": "🎯 QA Resolution: Closed 2 ClickUp Items (Items 2.0 & 28.0) with ZERO Dev Time. Audited all 319 URLs flagged as 'Canonicalised' in Screaming Frog. Confirmed 100% (319/319) are normal salon pro search filter URLs (?zipSearch=...) that properly point <link rel=\"canonical\" href=\"https://imagestudios.co/look-for-a-salon-pro/\"> strictly inside <head>. Verified clean in production DOM.",
                "sampleUrls": [
                    "https://imagestudios.co/look-for-a-salon-pro/?zipSearch=78732&services=&locationId=46396",
                    "https://imagestudios.co/look-for-a-salon-pro/?zipSearch=85374&services=&&locationId=36025"
                ]
            },
            {
                "id": "IMG-CMP-02",
                "title": "Noindex Directive Audit Across All 10 Flagged URLs — Verified Yoast XML Sitemaps (Item 24.0)",
                "title_en": "Noindex Directive Audit Across All 10 Flagged URLs — Verified Yoast XML Sitemaps (Item 24.0)",
                "category": "Crawl Directives QA",
                "completedDate": "October 19, 2026",
                "verifiedDate": "October 19, 2026",
                "verifiedBy": "Víctor Henríquez",
                "investedMinutes": 30,
                "assignedRole": "Víctor Henríquez",
                "clickupUrl": "https://app.clickup.com/t/868mdar44",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "summary": "🎯 QA Resolution: Closed Item 24.0 with ZERO Dev Time. Inspected all 10 URLs flagged under 'Directives: Noindex' in Screaming Frog (sitemap_index.xml, page-sitemap.xml, etc.). Confirmed all 10 are Yoast XML sitemaps sending intentional X-Robots-Tag: noindex, follow HTTP headers. This prevents XML markup from appearing in search results while ensuring crawlers still discover all internal URLs.",
                "sampleUrls": [
                    "https://imagestudios.co/sitemap_index.xml",
                    "https://imagestudios.co/page-sitemap.xml"
                ]
            },
            {
                "id": "IMG-CMP-03",
                "title": "Sitewide Structured Data (Schema.org JSON-LD) Live DOM QA & Preventative VideoObject Save (Items 6, 7, 8, 14, 19, 21, 22)",
                "title_en": "Sitewide Structured Data (Schema.org JSON-LD) Live DOM QA & Preventative VideoObject Save (Items 6, 7, 8, 14, 19, 21, 22)",
                "category": "Structured Data QA",
                "completedDate": "October 19, 2026",
                "verifiedDate": "October 19, 2026",
                "verifiedBy": "Víctor Henríquez",
                "investedMinutes": 75,
                "assignedRole": "Víctor Henríquez",
                "clickupUrl": "https://app.clickup.com/t/868mdar3u",
                "workbookUrl": "https://docs.google.com/spreadsheets/d/1HBVuKfPH9s33tiehTDsEdZ-IZvZvJezc/edit?gid=550147078#gid=550147078",
                "summary": "🎯 QA Resolution: Closed 7 ClickUp Items (Items 6.0, 7.0, 8.0, 14.0, 19.0, 21.0 & 22.0) with ZERO Dev Time. Verified live DOM JSON-LD deployment across all 6 core page templates (LocalBusiness on Locations, Service & FAQPage on /open-your-salon/, Breadcrumbs sitewide, CollectionPage on /locations/, and ProfilePage & Person on /pros/* and /bios/*). Prevented invalid VideoObject injection on /studio-tour/ after verifying it embeds a 3D Matterport iframe (not a video), saving the client from GSC critical video schema errors.",
                "sampleUrls": [
                    "https://imagestudios.co/studio-tour/",
                    "https://imagestudios.co/open-your-salon/",
                    "https://imagestudios.co/locations/",
                    "https://imagestudios.co/pros/kiran-y-gurung/"
                ]
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
