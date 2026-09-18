"""Test document upload and analysis."""
import asyncio
import httpx
import io

async def test():
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Test TXT upload
        txt_content = (
            "Technical Specifications for Tender:\n"
            "Supply and installation of Mild Steel Pipes for water supply under municipal corporation.\n"
            "Pipes shall conform to IS 1239 (Part 1) : 1990 and IS 3589 : 2001.\n"
            "Installation shall follow IS 6392.\n"
            "All fittings must have ISI mark certification.\n"
        ).encode('utf-8')
        
        files = {'file': ('tender_spec.txt', txt_content, 'text/plain')}
        r = await client.post('http://127.0.0.1:8000/api/analyze-document', files=files)
        print("Upload status:", r.status_code)
        assert r.status_code == 200, f"Failed: {r.text}"
        data = r.json()
        print("Detected standards:", data.get('detected_standards'))
        print("Recommendations count:", len(data.get('recommendations', [])))
        print("Potential outdated:", data.get('potential_outdated'))
        print("Potential gaps count:", len(data.get('potential_gaps', [])))
        print("DOCUMENT ANALYSIS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test())

