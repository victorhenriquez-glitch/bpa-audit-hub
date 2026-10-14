import json

# Enrich oh-deer.json
with open('bpa-audit-hub/data/clients/oh-deer.json', 'r', encoding='utf-8') as f:
    oh = json.load(f)

oh['technicalSeoLead'] = 'Víctor Henríquez'

for t in oh.get('tasks', []):
    if 'Victor' in t.get('assignedRole', ''):
        t['assignedRole'] = 'Víctor Henríquez'

# Set english instructions and criteria for ohDEER tasks
en_details = {
    'OHD-SPRINT-01': {
        'technicalInstructions_en': "1. Log into WordPress Admin of the ohDEER network.\n2. Navigate to Rank Math > Titles & Meta > Posts / Blog Archives.\n3. In 'Archive Title Format', update format to: `%title% %sep% %page% %sep% %sitename%`.\n4. In 'Archive Meta Description', append dynamic page token: `... - Page %page%`.\n5. Save changes and purge WP Engine object cache and Cloudflare edge cache.",
        'acceptanceCriteria_en': [
            "Blog page 2 shows distinct title tag containing 'Page 2'.",
            "Meta description dynamically reflects pagination index.",
            "Semrush audit flags 0 duplicate titles on /blog/page/X/."
        ]
    },
    'OHD-SPRINT-02': {
        'technicalInstructions_en': "1. Log into Cloudflare Dashboard for oh-deer.com zone.\n2. Go to Security > WAF > Custom Rules.\n3. Create an allow rule ('Skip / Bypass') when:\n   `http.user_agent contains \"SemrushBot\"`\n   Or configure crawl credentials / IP whitelisting for Bright Pink Agency.\n4. Confirm robots.txt contains no accidental crawl blocks.",
        'acceptanceCriteria_en': [
            "Semrush test crawl successfully connects with 0 WAF 403 blocks.",
            "Real user protection rules remain 100% active.",
            "Audit health score recalibrated cleanly to 92%+."
        ]
    },
    'OHD-SPRINT-03': {
        'technicalInstructions_en': "1. Open Screaming Frog SEO Spider (BPA Enterprise License).\n2. Exclude internal search query parameters (?s=, ?replytocom=).\n3. Set User-Agent to 'Googlebot-Desktop' to mirror live Google rendering.\n4. Save custom configuration profile and export clean baseline CSV.",
        'acceptanceCriteria_en': [
            "Crawl scope focused strictly on ~1,000 indexable HTML pages.",
            "Crawl execution time reduced by 60%.",
            "Automated CSV reports delivered cleanly to Account Management."
        ]
    },
    'OHD-BACKLOG-01': {
        'technicalInstructions_en': "1. Open Divi Theme Builder / Child Theme header & testimonial partials.\n2. Replace static <h1> testimonials wrappers with <div> or <span> styled with CSS classes.\n3. Ensure single semantic <h1> per page generated from post/page title.",
        'acceptanceCriteria_en': [
            "Single semantic H1 tag verified across all franchise subdirectories.",
            "Visual layout and responsive styling preserved identically."
        ]
    },
    'OHD-BACKLOG-02': {
        'technicalInstructions_en': "1. In WP Admin, navigate to Appearance > Menus.\n2. Update 245 internal navigation links from legacy URLs to their final canonical destinations.\n3. Update hardcoded footer links across child themes.",
        'acceptanceCriteria_en': [
            "0 internal 301 redirect hops found in Screaming Frog navigation audit.",
            "Faster crawl budget allocation and instant navigation response."
        ]
    },
    'OHD-BACKLOG-03': {
        'technicalInstructions_en': "1. Review GSC queries for 'Lowell MA mosquito control'.\n2. Consolidate local service areas in Central Mass vs Cape Cod.\n3. Adjust internal anchor text to clarify geographic boundaries.",
        'acceptanceCriteria_en': [
            "No keyword cannibalization or ranking fluctuation between nearby locations.",
            "Clear geographic entity mapping in local search."
        ]
    },
    'OHD-BACKLOG-04': {
        'technicalInstructions_en': "1. Batch convert PNG gallery images to WebP format (<100KB per image).\n2. Add descriptive, ADA-compliant alt attributes including service keywords.\n3. Configure automated WebP conversion in WordPress media pipeline.",
        'acceptanceCriteria_en': [
            "Zero content images exceed 150 KB.",
            "100% of service images possess descriptive alt text."
        ]
    },
    'OHD-BACKLOG-05': {
        'technicalInstructions_en': "1. Configure LocalBusiness schema in Rank Math Pro for franchise directories.\n2. Inject geoRadius, areaServed, address, and operating hours via JSON-LD.\n3. Test with Google Rich Results Test tool.",
        'acceptanceCriteria_en': [
            "Valid LocalBusiness structured data on all franchise landing pages.",
            "Zero errors and zero warnings in Schema Validator."
        ]
    }
}

for t in oh.get('tasks', []):
    tid = t['id']
    if tid in en_details:
        t.update(en_details[tid])

for ct in oh.get('completedTasks', []):
    if 'Victor' in ct.get('assignedRole', ''):
        ct['assignedRole'] = 'Víctor Henríquez'

with open('bpa-audit-hub/data/clients/oh-deer.json', 'w', encoding='utf-8') as f:
    json.dump(oh, f, indent=2, ensure_ascii=False)

print('oh-deer.json successfully updated!')

# Enrich us-lawns.json
with open('bpa-audit-hub/data/clients/us-lawns.json', 'r', encoding='utf-8') as f:
    us = json.load(f)

us['technicalSeoLead'] = 'Víctor Henríquez'

for t in us.get('tasks', []):
    if t.get('assignedRole') == 'Victor Henríquez (Technical SEO)':
        t['assignedRole'] = 'Víctor Henríquez'
    elif 'Victor' in t.get('assignedRole', ''):
        t['assignedRole'] = 'Víctor Henríquez & Augustina'

us_en_details = {
    'USL-MIG-01': {
        'rootCause_en': "The legacy website utilizes inconsistent legacy URL structures (/commercial-landscaping/locations/ vs /locations/service-area/). Without a 1:1 migration matrix, over 40% of organic traffic will be lost during migration.",
        'businessImpact_en': "Protects historical search rankings and organic lead generation across thousands of high-value B2B commercial keywords during domain switchover.",
        'technicalInstructions_en': "1. Extract all URLs with organic traffic from GSC and GA4 over the last 12 months.\n2. Crawl full legacy architecture with Screaming Frog.\n3. Build comprehensive 1:1 redirect map spreadsheet matching legacy URLs to new Gutenberg structure.\n4. Hand off to Augustina for Nginx/Cloudflare deployment.",
        'acceptanceCriteria_en': [
            "100% of historical traffic URLs mapped to new canonical target.",
            "Zero redirect loops or 404 dead ends during switchover."
        ]
    },
    'USL-MIG-02': {
        'rootCause_en': "The new franchise template being coded in Gutenberg must adhere to strict semantic SEO standards (single dynamic H1 per location, automated breadcrumbs JSON-LD, native lazy loading).",
        'businessImpact_en': "Ensures the WordPress architecture launches with flawless technical SEO, preventing expensive post-launch refactoring.",
        'technicalInstructions_en': "1. Review ACF block architecture on Staging environment with Augustina.\n2. Verify Heading hierarchy, schema markup injection, and image WebP delivery.\n3. Validate dynamic Rank Math variables for franchise metadata.",
        'acceptanceCriteria_en': [
            "Staging template approved with 95+ score in Core Web Vitals and HTML5 hierarchy audit."
        ]
    }
}

for t in us.get('tasks', []):
    tid = t['id']
    if tid in us_en_details:
        t.update(us_en_details[tid])

for ct in us.get('completedTasks', []):
    if 'Victor' in ct.get('assignedRole', ''):
        ct['assignedRole'] = 'Víctor Henríquez'

with open('bpa-audit-hub/data/clients/us-lawns.json', 'w', encoding='utf-8') as f:
    json.dump(us, f, indent=2, ensure_ascii=False)

print('us-lawns.json successfully updated!')
