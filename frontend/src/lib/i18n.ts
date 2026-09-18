// BIS SmartSpec AI — i18n Translations (English + Hindi)

export const translations = {
  en: {
    // Navigation
    'nav.home': 'Dashboard',
    'nav.search': 'Search Standards',
    'nav.standards': 'Standards Explorer',
    'nav.analyze': 'Tender Analyzer',
    'nav.compliance': 'Compliance Checker',
    'nav.version': 'Version Check',
    'nav.datasources': 'Data Sources',
    'nav.about': 'About',
    
    // App
    'app.name': 'BIS SmartSpec AI',
    'app.tagline': 'From Procurement Specification to Applicable Indian Standards — Intelligently.',
    'app.demo_mode': 'DEMO MODE',
    'app.demo_notice': 'Demo data — Not official BIS data',
    
    // Search
    'search.placeholder': 'Describe what you want to procure (e.g., steel pipes for water supply)',
    'search.button': 'Find Standards',
    'search.hint': 'Try: "LED street lights" or "पानी की सप्लाई के लिए स्टील पाइप"',
    'search.results_count': 'recommendations found',
    'search.time': 'in',
    'search.no_results': 'No standards found. Try a broader description.',
    'search.loading': 'Searching standards database...',
    'search.empty_index': 'Standards index is not initialized. Run the seeding scripts first.',
    
    // Quick Queries
    'quick.title': 'Demo Queries',
    'quick.q1': 'Steel pipes for water supply',
    'quick.q2': 'LED street lights for municipal roads',
    'quick.q3': 'PVC insulated electric cables',
    'quick.q4': 'Cement for building construction',
    'quick.q5': 'Safety helmet for industrial workers',
    'quick.q6': 'पानी की सप्लाई के लिए स्टील पाइप',
    
    // Result Cards
    'result.relevance': 'Semantic Relevance',
    'result.confidence': 'Confidence',
    'result.status': 'Status',
    'result.sector': 'Sector',
    'result.type': 'Type',
    'result.edition': 'Edition Year',
    'result.why': 'Why relevant?',
    'result.evidence': 'Source Evidence',
    'result.certification': 'Certification',
    'result.allied': 'allied standards',
    'result.view': 'View Details',
    'result.add_checklist': 'Add to Checklist',
    'result.limitations': 'Limitations',
    'result.ai_explanation': 'AI-generated explanation',
    
    // Verification badges
    'badge.demo': 'DEMO',
    'badge.verified': 'VERIFIED',
    'badge.unverified': 'UNVERIFIED',
    'badge.user': 'USER DATA',
    
    // Status badges
    'status.current': 'Current',
    'status.superseded': 'Superseded',
    'status.withdrawn': 'Withdrawn',
    'status.amended': 'Amended',
    'status.unknown': 'Unknown',
    'status.demo': 'Demo',
    
    // Confidence
    'confidence.high': 'High',
    'confidence.medium': 'Medium',
    'confidence.low': 'Low',
    
    // Relationship types
    'rel.NORMATIVE_REFERENCE': 'Normative Reference',
    'rel.TEST_METHOD': 'Test Method',
    'rel.TERMINOLOGY': 'Terminology',
    'rel.SAFETY': 'Safety',
    'rel.INSTALLATION': 'Installation',
    'rel.MATERIAL': 'Material',
    'rel.COMPONENT': 'Component',
    'rel.RELATED_PRODUCT': 'Related Product',
    'rel.QUALITY_MANAGEMENT': 'Quality Management',
    'rel.REFERENCE': 'Reference',
    'rel.SUPERSEDES': 'Supersedes',
    'rel.AMENDED_BY': 'Amended By',
    
    // Compliance
    'compliance.title': 'Compliance Checklist',
    'compliance.pending': 'Pending',
    'compliance.verified': 'Verified',
    'compliance.na': 'Not Applicable',
    'compliance.add': 'Add Item',
    'compliance.export': 'Export Checklist',
    
    // Checklist item types
    'item.PRODUCT_STANDARD': 'Applicable product standard',
    'item.TEST_METHOD': 'Relevant test method',
    'item.SAFETY': 'Safety requirements',
    'item.INSTALLATION': 'Installation requirements',
    'item.CERTIFICATION': 'Certification requirement',
    'item.VERSION': 'Latest edition verified',
    'item.SPECIFICATION': 'Tender specification cross-checked',
    
    // MSME Mode
    'msme.toggle': 'MSME Mode',
    'msme.description': 'Simplified language for small businesses',
    'msme.normative_reference': 'Another standard that this standard depends on',
    'msme.superseded': 'An older version that has been replaced',
    'msme.test_method': 'A standard that explains how to test this product',
    
    // Export
    'export.pdf': 'Export PDF Report',
    'export.excel': 'Export Excel',
    'export.generating': 'Generating...',
    
    // Upload
    'upload.title': 'Upload Tender Document',
    'upload.drag': 'Drag & drop your document here, or click to browse',
    'upload.types': 'Supported: PDF, DOCX, TXT (max 20MB)',
    'upload.analyzing': 'Analyzing document...',
    'upload.error': 'Document could not be processed. Try a text-based PDF or a smaller file.',
    
    // Dashboard
    'dashboard.title': 'BIS SmartSpec AI Dashboard',
    'dashboard.standards': 'Standards in Database',
    'dashboard.verified': 'Verified Records',
    'dashboard.demo': 'Demo Records',
    'dashboard.searches': 'Searches Performed',
    'dashboard.documents': 'Documents Analyzed',
    'dashboard.checklists': 'Checklists Created',
    
    // Disclaimer
    'disclaimer.text': 'This prototype provides decision-support recommendations. Procurement officials must verify applicable standards, current editions, amendments, and certification requirements against authoritative BIS/government sources before finalizing procurement specifications.',
    
    // Filters
    'filter.sector': 'Sector',
    'filter.type': 'Standard Type',
    'filter.status': 'Status',
    'filter.all': 'All',
    
    // Version Check
    'version.title': 'Version & Currency Checker',
    'version.placeholder': 'Enter IS number (e.g., IS 1239)',
    'version.year': 'Referenced year (optional)',
    'version.check': 'Check Version',
    'version.outdated_warning': 'Potential Outdated Reference',
    'version.newer': 'Newer record found',
    
    // General
    'general.back': 'Back',
    'general.loading': 'Loading...',
    'general.error': 'Something went wrong. Please try again.',
    'general.no_data': 'No data available',
    'general.source': 'Source',
    'general.more': 'Show More',
    'general.less': 'Show Less',
  },
  hi: {
    // Navigation
    'nav.home': 'डैशबोर्ड',
    'nav.search': 'मानक खोजें',
    'nav.standards': 'मानक एक्सप्लोरर',
    'nav.analyze': 'टेंडर विश्लेषक',
    'nav.compliance': 'अनुपालन जांचकर्ता',
    'nav.version': 'संस्करण जांच',
    'nav.datasources': 'डेटा स्रोत',
    'nav.about': 'परिचय',
    
    // App
    'app.name': 'BIS SmartSpec AI',
    'app.tagline': 'खरीद विनिर्देश से लागू भारतीय मानकों तक — बुद्धिमानी से।',
    'app.demo_mode': 'डेमो मोड',
    'app.demo_notice': 'डेमो डेटा — आधिकारिक BIS डेटा नहीं',
    
    // Search
    'search.placeholder': 'आप क्या खरीदना चाहते हैं, वर्णन करें (जैसे: जल आपूर्ति के लिए स्टील पाइप)',
    'search.button': 'मानक खोजें',
    'search.hint': 'उदाहरण: "एलईडी स्ट्रीट लाइट" या "steel pipes for water supply"',
    'search.results_count': 'सिफारिशें मिलीं',
    'search.time': 'में',
    'search.no_results': 'कोई मानक नहीं मिला। व्यापक विवरण आज़माएं।',
    'search.loading': 'मानक डेटाबेस खोज रहे हैं...',
    'search.empty_index': 'मानक इंडेक्स प्रारंभ नहीं हुआ है। पहले सीडिंग स्क्रिप्ट चलाएं।',
    
    // Quick Queries
    'quick.title': 'डेमो प्रश्न',
    'quick.q1': 'Steel pipes for water supply',
    'quick.q2': 'LED street lights for municipal roads',
    'quick.q3': 'PVC insulated electric cables',
    'quick.q4': 'Cement for building construction',
    'quick.q5': 'Safety helmet for industrial workers',
    'quick.q6': 'पानी की सप्लाई के लिए स्टील पाइप',
    
    // Result Cards
    'result.relevance': 'अर्थपूर्ण प्रासंगिकता',
    'result.confidence': 'विश्वास',
    'result.status': 'स्थिति',
    'result.sector': 'क्षेत्र',
    'result.type': 'प्रकार',
    'result.edition': 'संस्करण वर्ष',
    'result.why': 'क्यों प्रासंगिक?',
    'result.evidence': 'स्रोत साक्ष्य',
    'result.certification': 'प्रमाणीकरण',
    'result.allied': 'संबद्ध मानक',
    'result.view': 'विवरण देखें',
    'result.add_checklist': 'चेकलिस्ट में जोड़ें',
    'result.limitations': 'सीमाएं',
    'result.ai_explanation': 'एआई-उत्पन्न स्पष्टीकरण',
    
    // Verification badges
    'badge.demo': 'डेमो',
    'badge.verified': 'सत्यापित',
    'badge.unverified': 'असत्यापित',
    'badge.user': 'उपयोगकर्ता डेटा',
    
    // Status badges
    'status.current': 'वर्तमान',
    'status.superseded': 'प्रतिस्थापित',
    'status.withdrawn': 'वापस लिया',
    'status.amended': 'संशोधित',
    'status.unknown': 'अज्ञात',
    'status.demo': 'डेमो',
    
    // MSME Mode
    'msme.toggle': 'MSME मोड',
    'msme.description': 'छोटे व्यवसायों के लिए सरल भाषा',
    'msme.normative_reference': 'एक अन्य मानक जिस पर यह मानक निर्भर करता है',
    'msme.superseded': 'एक पुराना संस्करण जिसे बदल दिया गया है',
    'msme.test_method': 'एक मानक जो बताता है कि इस उत्पाद का परीक्षण कैसे करें',
    
    // Compliance
    'compliance.title': 'अनुपालन चेकलिस्ट',
    'compliance.pending': 'लंबित',
    'compliance.verified': 'सत्यापित',
    'compliance.na': 'लागू नहीं',
    
    // General
    'general.back': 'वापस',
    'general.loading': 'लोड हो रहा है...',
    'general.error': 'कुछ गलत हुआ। कृपया पुनः प्रयास करें।',
    'general.no_data': 'कोई डेटा उपलब्ध नहीं',
    'disclaimer.text': 'यह प्रोटोटाइप निर्णय-समर्थन सिफारिशें प्रदान करता है। खरीद अधिकारियों को खरीद विनिर्देशों को अंतिम रूप देने से पहले अधिकृत BIS/सरकारी स्रोतों से लागू मानकों, वर्तमान संस्करणों, संशोधनों और प्रमाणीकरण आवश्यकताओं को सत्यापित करना होगा।',
    'filter.all': 'सभी',
    'filter.sector': 'क्षेत्र',
    'filter.type': 'मानक प्रकार',
    'filter.status': 'स्थिति',
    'export.pdf': 'पीडीएफ रिपोर्ट',
    'export.excel': 'एक्सेल',
    'export.generating': 'तैयार हो रहा है...',
    'upload.title': 'टेंडर दस्तावेज़ अपलोड करें',
    'upload.drag': 'यहां खींचें या ब्राउज़ करने के लिए क्लिक करें',
    'upload.types': 'समर्थित: PDF, DOCX, TXT (अधिकतम 20MB)',
    'upload.analyzing': 'दस्तावेज़ का विश्लेषण हो रहा है...',
    'upload.error': 'दस्तावेज़ प्रसंस्करण विफल। टेक्स्ट-आधारित PDF या छोटी फ़ाइल आज़माएं।',
    'confidence.high': 'उच्च',
    'confidence.medium': 'मध्यम',
    'confidence.low': 'निम्न',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
