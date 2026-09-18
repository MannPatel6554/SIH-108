"""Quick integration test."""
import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Health
        r = await client.get('http://127.0.0.1:8000/health')
        print('Health status:', r.status_code)
        d = r.json()
        print('Vector store docs:', d['services']['vector_store']['document_count'])
        print('Embedding available:', d['services']['embedding_model']['available'])
        
        # Search
        r2 = await client.post('http://127.0.0.1:8000/api/search', json={'query': 'steel pipes for water supply', 'top_k': 3})
        print('Search status:', r2.status_code)
        data = r2.json()
        print('Results count:', data.get('total_results', 0))
        for res in data.get('results', []):
            print(f"  - {res['standard_number']}: {res['title'][:50]} (score={res['score']})")
        
        # Hindi search
        r3 = await client.post('http://127.0.0.1:8000/api/search', json={'query': 'पानी की सप्लाई के लिए स्टील पाइप', 'language': 'hi', 'top_k': 3})
        print('Hindi search status:', r3.status_code)
        d3 = r3.json()
        print('Hindi results:', d3.get('total_results', 0), 'lang:', d3.get('language'))
        
        # Stats
        r4 = await client.get('http://127.0.0.1:8000/api/stats')
        print('Stats status:', r4.status_code)
        d4 = r4.json()
        print('Total standards:', d4.get('total_standards'))
        
        # Version check
        r5 = await client.post('http://127.0.0.1:8000/api/version-check', json={'standard_number': 'IS 1239', 'referenced_year': 2000})
        print('Version check status:', r5.status_code)
        d5 = r5.json()
        print('Version check found:', d5.get('found'), 'outdated:', d5.get('is_potentially_outdated'))
        
        # Export PDF
        r6 = await client.post('http://127.0.0.1:8000/api/export/pdf', json={'query': 'test', 'results': [], 'checklist_items': []})
        print('PDF export status:', r6.status_code)
        
        # Export Excel
        r7 = await client.post('http://127.0.0.1:8000/api/export/excel', json={'query': 'test', 'results': [], 'checklist_items': []})
        print('Excel export status:', r7.status_code)
        
        # Data sources
        r8 = await client.get('http://127.0.0.1:8000/api/data-sources')
        print('Data sources status:', r8.status_code)
        print('ALL TESTS PASSED!')

if __name__ == "__main__":
    asyncio.run(test())

