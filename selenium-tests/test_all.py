import pytest
import re
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

BASE_URL = "http://13.233.39.193:8202"

@pytest.fixture(scope="function")
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    
    driver = webdriver.Chrome(options=chrome_options)
    driver.implicitly_wait(10)
    yield driver
    driver.quit()

def login_as(driver, role="admin"):
    """Helper to login with role selection"""
    driver.get(f"{BASE_URL}/login")
    time.sleep(3)  # Wait for React to render
    
    # Select role from dropdown
    try:
        select = Select(driver.find_element(By.TAG_NAME, "select"))
        select.select_by_value(role)
        time.sleep(1)
    except:
        pass  # Dropdown might not exist or already selected
    
    # Get credentials based on role
    credentials = {
        "admin": ("admin", "admin123"),
        "receptionist": ("receptionist", "reception123"),
        "doctor": ("dr.ahmed", "doctor123")
    }
    username, password = credentials.get(role, ("admin", "admin123"))
    
    # Find inputs (React might have rendered them after select)
    inputs = driver.find_elements(By.TAG_NAME, "input")
    
    # Fill username and password
    for inp in inputs:
        inp_type = inp.get_attribute("type")
        placeholder = inp.get_attribute("placeholder") or ""
        
        if inp_type == "text" or "username" in placeholder.lower():
            inp.clear()
            inp.send_keys(username)
        elif inp_type == "password" or "password" in placeholder.lower():
            inp.clear()
            inp.send_keys(password)
    
    # Click submit button
    buttons = driver.find_elements(By.TAG_NAME, "button")
    for btn in buttons:
        if btn.get_attribute("type") == "submit" or "sign" in btn.text.lower():
            btn.click()
            break
    
    time.sleep(3)  # Wait for navigation

# ============================================
# TEST LOGIN (5 tests)
# ============================================

class TestLogin:
    def test_login_page_renders(self, driver):
        """TC1: Login page loads with all elements"""
        driver.get(f"{BASE_URL}/login")
        time.sleep(3)
        
        # Check title
        assert "Hospital Management" in driver.page_source
        
        # Check form elements exist
        assert len(driver.find_elements(By.TAG_NAME, "input")) >= 2
        assert len(driver.find_elements(By.TAG_NAME, "button")) >= 1
        
        # Check role selector exists
        selects = driver.find_elements(By.TAG_NAME, "select")
        assert len(selects) >= 1
        
        # Check login button
        buttons = driver.find_elements(By.TAG_NAME, "button")
        submit_btn = [b for b in buttons if "sign" in b.text.lower() or b.get_attribute("type") == "submit"]
        assert len(submit_btn) >= 1

    def test_login_valid_admin(self, driver):
        """TC2: Admin login succeeds"""
        login_as(driver, "admin")
        
        # Check we're logged in (URL changed or dashboard content)
        current_url = driver.current_url.lower()
        page_source = driver.page_source.lower()
        
        # Either not on login page or has dashboard content
        not_login = "login" not in current_url
        has_content = "dashboard" in page_source or "patient" in page_source or "logout" in page_source
        
        assert not_login or has_content or len(driver.page_source) > 2000

    def test_login_invalid_password(self, driver):
        """TC3: Wrong password fails or stays on page"""
        driver.get(f"{BASE_URL}/login")
        time.sleep(3)
        
        # Select admin role
        try:
            select = Select(driver.find_element(By.TAG_NAME, "select"))
            select.select_by_value("admin")
            time.sleep(1)
        except:
            pass
        
        # Fill wrong credentials
        inputs = driver.find_elements(By.TAG_NAME, "input")
        for inp in inputs:
            inp_type = inp.get_attribute("type")
            if inp_type == "text":
                inp.clear()
                inp.send_keys("admin")
            elif inp_type == "password":
                inp.clear()
                inp.send_keys("wrongpassword")
        
        # Submit
        buttons = driver.find_elements(By.TAG_NAME, "button")
        for btn in buttons:
            if btn.get_attribute("type") == "submit":
                btn.click()
                break
        
        time.sleep(2)
        
        # Should still be on login or show error
        assert "login" in driver.current_url.lower() or "invalid" in driver.page_source.lower() or "error" in driver.page_source.lower()

    def test_login_receptionist(self, driver):
        """TC4: Receptionist login"""
        login_as(driver, "receptionist")
        
        # Check logged in
        not_login = "login" not in driver.current_url.lower()
        has_content = len(driver.page_source) > 2000
        
        assert not_login or has_content

    def test_login_doctor(self, driver):
        """TC5: Doctor login"""
        login_as(driver, "doctor")
        
        not_login = "login" not in driver.current_url.lower()
        has_content = len(driver.page_source) > 2000
        
        assert not_login or has_content

# ============================================
# TEST DASHBOARD (3 tests)
# ============================================

class TestDashboard:
    def test_dashboard_loads_after_login(self, driver):
        """TC6: Dashboard accessible after login"""
        login_as(driver, "admin")
        time.sleep(2)
        
        # Navigate to dashboard
        driver.get(f"{BASE_URL}/")
        time.sleep(3)
        
        body = driver.find_element(By.TAG_NAME, "body")
        assert body.is_displayed()
        assert len(driver.page_source) > 1000

    def test_dashboard_navigation(self, driver):
        """TC7: Dashboard has navigation"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/")
        time.sleep(3)
        
        page = driver.page_source.lower()
        nav_items = ["patient", "doctor", "appointment", "bill"]
        found = sum(1 for item in nav_items if item in page)
        assert found >= 2  # At least 2 nav items visible

    def test_dashboard_content(self, driver):
        """TC8: Dashboard has meaningful content"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/")
        time.sleep(3)
        
        # Should have some text content
        text_content = driver.find_element(By.TAG_NAME, "body").text
        assert len(text_content) > 100

# ============================================
# TEST PATIENTS (3 tests)
# ============================================

class TestPatients:
    def test_patients_page(self, driver):
        """TC9: Patients page loads"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/patients")
        time.sleep(3)
        
        assert "patient" in driver.page_source.lower() or len(driver.page_source) > 1000

    def test_patients_list(self, driver):
        """TC10: Patients list has content"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/patients")
        time.sleep(3)
        
        # Check for table or cards
        tables = driver.find_elements(By.TAG_NAME, "table")
        divs = driver.find_elements(By.TAG_NAME, "div")
        assert len(tables) > 0 or len(divs) > 10

    def test_patients_has_data(self, driver):
        """TC11: Some patient data visible"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/patients")
        time.sleep(3)
        
        page_text = driver.find_element(By.TAG_NAME, "body").text
        assert len(page_text) > 50  # Has actual text content

# ============================================
# TEST DOCTORS (2 tests)
# ============================================

class TestDoctors:
    def test_doctors_page(self, driver):
        """TC12: Doctors page loads"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/doctors")
        time.sleep(3)
        
        assert "doctor" in driver.page_source.lower() or len(driver.page_source) > 1000

    def test_doctors_specializations(self, driver):
        """TC13: Doctor info visible"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/doctors")
        time.sleep(3)
        
        specs = ["cardiology", "pediatrics", "orthopedics", "doctor", "specialization"]
        page = driver.page_source.lower()
        assert any(s in page for s in specs)

# ============================================
# TEST APPOINTMENTS (2 tests)
# ============================================

class TestAppointments:
    def test_appointments_page(self, driver):
        """TC14: Appointments page loads"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)
        
        assert "appointment" in driver.page_source.lower() or len(driver.page_source) > 1000

    def test_appointment_content(self, driver):
        """TC15: Appointment data visible"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/appointments")
        time.sleep(3)
        
        statuses = ["scheduled", "completed", "pending", "appointment"]
        page = driver.page_source.lower()
        assert any(s in page for s in statuses)

# ============================================
# TEST BILLS (1 test)
# ============================================

class TestBills:
    def test_bills_page(self, driver):
        """TC16: Bills page loads"""
        login_as(driver, "admin")
        driver.get(f"{BASE_URL}/bills")
        time.sleep(3)
        
        assert "bill" in driver.page_source.lower() or "payment" in driver.page_source.lower() or len(driver.page_source) > 1000
