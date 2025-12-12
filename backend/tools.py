# backend/tools.py
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

async def scrape_job_text(url: str) -> str:
    """
    Fetches text using a headless browser (Playwright) to handle 
    JS-heavy sites and basic bot protection.
    """
    try:
        async with async_playwright() as p:
            # Launch browser (headless=True is faster, False is useful for debugging)
            browser = await p.chromium.launch(headless=True)
            
            # Create a context with a real user agent to look like a human
            context = await browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
            
            page = await context.new_page()
            
            # Go to URL and wait for the network to be idle (page fully loaded)
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            
            # Get the full HTML content
            content = await page.content()
            
            await browser.close()
            
            # Parse with BeautifulSoup as before
            soup = BeautifulSoup(content, "html.parser")
            
            # Remove noise
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()
                
            text = soup.get_text(separator=' ')
            
            # Clean up whitespace
            clean_text = ' '.join(text.split())
            
            return clean_text[:10000] # Limit context size

    except Exception as e:
        return f"Error scraping job: {str(e)}"