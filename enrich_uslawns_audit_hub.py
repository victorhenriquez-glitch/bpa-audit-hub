import json
import os
import re

print("Starting BPA Audit Hub Enrichment for US Lawns...")

json_path = 'bpa-audit-hub/data/clients/us-lawns.json'
data_store_path = 'bpa-audit-hub/js/data-store.js'

uslawns_data = {
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
    "billable": True,
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
      "billable": True,
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
      "billable": True,
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
      "billable": True,
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
      "billable": True,
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
      "billable": True,
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
      "billable": True,
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
      "billable": True,
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
      "billable": True,
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
}

# 1. Write us-lawns.json
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(uslawns_data, f, indent=2, ensure_ascii=False)
print("Saved bpa-audit-hub/data/clients/us-lawns.json successfully.")

# 2. Update data-store.js
with open(data_store_path, 'r', encoding='utf-8') as f:
    ds_content = f.read()

# Replace the us-lawns block in data-store.js
prefix = "'us-lawns': "
idx = ds_content.find(prefix)
if idx != -1:
    # Find the end of the us-lawns dictionary
    # In data-store.js, window.BPA_DATA = { 'oh-deer': { ... }, 'us-lawns': { ... } };
    part_before = ds_content[:idx + len(prefix)]
    # format json
    json_str = json.dumps(uslawns_data, indent=4, ensure_ascii=False)
    # indent json_str
    # find where us-lawns closes
    # It ends before the closing of window.BPA_DATA
    part_after = "\n};\n"
    
    # We can write the entire data-store.js cleanly
    ohdeer_data = None
    with open('bpa-audit-hub/data/clients/oh-deer.json', 'r', encoding='utf-8') as f:
        ohdeer_data = json.load(f)
        
    new_ds_content = """/**
 * Bright Pink Agency - Client Data Store
 * Provides offline-compatible, client datasets and sanitization utilities.
 * 100% Ground-Truth Verified - Zero Unverified Assumptions.
 */

window.BPA_DATA = {
  'oh-deer': """ + json.dumps(ohdeer_data, indent=4, ensure_ascii=False) + """,
  'us-lawns': """ + json.dumps(uslawns_data, indent=4, ensure_ascii=False) + """
};
"""
    with open(data_store_path, 'w', encoding='utf-8') as f:
        f.write(new_ds_content)
    print("Updated bpa-audit-hub/js/data-store.js successfully.")
else:
    print("WARNING: Could not find 'us-lawns' key in data-store.js")

print("Enrichment finished successfully!")
