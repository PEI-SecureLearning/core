import re
from playwright.sync_api import Playwright, sync_playwright, expect

def run(playwright: Playwright) -> None:
    # 1. Start Firefox in a completely private and clean context with slow_mo to observe steps
    print("Launching Firefox browser (slow_mo active)...")
    browser = playwright.firefox.launch(headless=False, slow_mo=800)
    context = browser.new_context()
    page = context.new_page()
    
    # Define helper functions to wait for elements synchronously before interacting
    def wait_and_click(locator, timeout=15000):
        locator.wait_for(state="visible", timeout=timeout)
        locator.click()

    def wait_and_fill(locator, value, timeout=15000):
        locator.wait_for(state="visible", timeout=timeout)
        locator.fill(value)

    print("Navigating to frontend...")
    page.goto("http://localhost:5173/")
    
    # 2. Login Flow with explicit synchronous waits
    print("Entering organization email...")
    wait_and_fill(page.get_by_role("textbox", name="name@company.com"), "org_manager@ua.pt")
    wait_and_click(page.get_by_role("button"))
    
    print("Submitting Keycloak credentials...")
    wait_and_fill(page.get_by_role("textbox", name="Username or email"), "org_manager")
    wait_and_fill(page.get_by_role("textbox", name="Password"), "1234")
    wait_and_click(page.get_by_role("button", name="Sign In"))
    
    # 3. Explore & Phishing Kit creation
    print("Navigating to Explore page...")
    explore_link = page.get_by_role("link", name="Phishing Kits")
    wait_and_click(explore_link)
    
    print("Creating Phishing Kit...")
    wait_and_click(page.get_by_role("button", name="Create First Kit"))
    
    wait_and_fill(page.get_by_role("textbox", name="Kit Name * More information"), "PEI presentation")
    wait_and_fill(page.get_by_role("textbox", name="Description More information"), "Phishing kit for pei presentation")
    wait_and_click(page.get_by_role("button", name="Continue"))
    
    # Select Lancamento das notas Email
    wait_and_click(page.get_by_role("button", name="Lancamento das notas Email"))
    wait_and_click(page.get_by_role("button", name="Continue"))
    
    # Select IDP UA Landing Page (handling dynamic hex ID via regex)
    idp_page_btn = page.get_by_role("button", name=re.compile(r"thumb-.* Preview IDP UA IDP UA page\."))
    wait_and_click(idp_page_btn)
    wait_and_click(page.get_by_role("button", name="Continue"))
    
    # Select SMTP profiles
    wait_and_click(page.get_by_role("combobox", name="Search profiles by name or"))
    wait_and_click(page.get_by_role("button", name="Marketing SMTP marketing@ua."))
    wait_and_click(page.get_by_role("button", name="Complete"))
    wait_and_click(page.get_by_role("button", name="Back to Phishing Kits"))
    
    # 4. Campaign Creation Flow
    print("Navigating to Campaigns...")
    wait_and_click(page.get_by_role("link", name="Campaigns"))
    wait_and_click(page.get_by_role("link", name="New Campaign"))
    
    wait_and_fill(page.get_by_role("textbox", name="Campaign Name *"), "Pei presentation")
    wait_and_click(page.get_by_role("button", name="Next"))
    
    # Select User Group (PEI)
    wait_and_click(page.get_by_role("combobox", name="Search groups..."))
    wait_and_click(page.get_by_role("button", name="PEI /PEI"))
    wait_and_click(page.get_by_role("button", name="Next"))
    
    # Select Phishing Kit
    wait_and_click(page.get_by_role("combobox", name="Search phishing kits by name"))
    wait_and_click(page.get_by_role("button", name="PEI presentation Phishing kit"))
    wait_and_click(page.get_by_role("button", name="Next"))
    
    # Select SMTP profile
    wait_and_click(page.get_by_role("combobox", name="Search profiles by name or"))
    wait_and_click(page.get_by_role("button", name="Marketing SMTP marketing@ua."))
    wait_and_click(page.get_by_role("button", name="Next"))
    
    # Complete
    wait_and_click(page.get_by_role("button", name="Complete"))
    
    # View Details (using regex to ignore date matching)
    campaign_row = page.get_by_role("row", name=re.compile(r"Pei presentation Scheduled.*"))
    wait_and_click(campaign_row.get_by_label("Campaign options"))
    wait_and_click(page.get_by_role("link", name="View Details"))
    
    # 5. Course Assignment Flow
    print("Assigning Courses...")
    wait_and_click(page.get_by_role("button", name="Learning"))
    wait_and_click(page.get_by_role("link", name="Manage Courses"))
    wait_and_click(page.get_by_role("link", name="Assign Courses"))
    wait_and_click(page.get_by_role("button", name="Continue"))
    
    # Select the first course
    wait_and_click(page.locator(".w-full.h-full.flex.items-center.justify-center").first)
    wait_and_click(page.get_by_role("button", name="Continue"))
    
    # Select target groups
    wait_and_click(page.get_by_text("5 members"))
    wait_and_click(page.locator("div").filter(has_text=re.compile(r"^group-a2 members$")).first)
    wait_and_click(page.get_by_role("button", name="Continue"))
    wait_and_click(page.get_by_role("button", name="Complete"))
    
    print("Playwright flow completed successfully!")
    
    # ---------------------
    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
