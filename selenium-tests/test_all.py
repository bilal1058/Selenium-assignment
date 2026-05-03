import pytest
import re
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://13.233.39.193:8202"


@pytest.fixture(scope="function")
def driver():
    """Headless Chrome for AWS EC2"""
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


@pytest.fixture
def logged_in_driver(driver):
    """Login as admin"""
    driver.get(f"{BASE_URL}/login")
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "input"))
    )
    inputs = driver.find_elements(By.TAG_NAME, "input")
    inputs[0].send_keys("admin")
    inputs[1].send_keys("admin123")
    driver.find_element(By.TAG_NAME, "button").click()
    WebDriverWait(driver, 10).until(
        lambda d: "login" not in d.current_url.lower()
    )
    return driver


# ============================================
# TEST LOGIN (5 tests)
# ============================================

class TestLogin:
    def test_login_page_renders(self, driver):
        """TC1: Login page loads with form"""
        driver.get(f"{BASE_URL}/login")
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "input"))
        )
        inputs = driver.find_elements(By.TAG_NAME, "input")
        assert len(inputs) >= 2
        assert driver.find_element(By.TAG_NAME, "button").is_displayed()

    def test_login_valid_admin(self, driver):
        """TC2: Admin login succeeds"""
        driver.get(f"{BASE_URL}/login")
        inputs = driver.find_elements(By.TAG_NAME, "input")
        inputs[0].send_keys("admin")
        inputs[1].send_keys("admin123")
        driver.find_element(By.TAG_NAME, "button").click()
        WebDriverWait(driver, 10).until(
            lambda d: "login" not in d.current_url.lower()
        )
        assert "login" not in driver.current_url.lower()

    def test_login_invalid_password(self, driver):
        """TC3: Wrong password fails"""
        driver.get(f"{BASE_URL}/login")
        inputs = driver.find_elements(By.TAG_NAME, "input")
        inputs[0].send_keys("admin")
        inputs[1].send_keys("wrongpass")
        driver.find_element(By.TAG_NAME, "button").click()
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        assert "login" in driver.current_url.lower() or "invalid" in driver.page_source.lower()

    def test_login_empty_fields(self, driver):
        """TC4: Empty fields stay on login"""
        driver.get(f"{BASE_URL}/login")
        driver.find_element(By.TAG_NAME, "button").click()
        assert "login" in driver.current_url.lower()

    def test_login_receptionist(self, driver):
        """TC5: Receptionist login works"""
        driver.get(f"{BASE_URL}/login")
        inputs = driver.find_elements(By.TAG_NAME, "input")
        inputs[0].send_keys("receptionist")
        inputs[1].send_keys("reception123")
        driver.find_element(By.TAG_NAME, "button").click()
        WebDriverWait(driver, 10).until(
            lambda d: "login" not in d.current_url.lower()
        )
        assert "login" not in driver.current_url.lower()


# ============================================
# TEST DASHBOARD (3 tests)
# ============================================

class TestDashboard:
    def test_dashboard_loads(self, logged_in_driver):
        """TC6: Dashboard renders after login"""
        logged_in_driver.get(f"{BASE_URL}/")
        body = logged_in_driver.find_element(By.TAG_NAME, "body")
        assert body.is_displayed()

    def test_navigation_menu(self, logged_in_driver):
        """TC7: Navigation has menu items"""
        logged_in_driver.get(f"{BASE_URL}/")
        page = logged_in_driver.page_source.lower()
        items = ["patients", "doctors", "appointments", "bills"]
        found = sum(1 for item in items if item in page)
        assert found >= 3

    def test_dashboard_stats(self, logged_in_driver):
        """TC8: Dashboard shows statistics"""
        logged_in_driver.get(f"{BASE_URL}/")
        numbers = re.findall(r'\d+', logged_in_driver.page_source)
        assert len(numbers) > 0


# ============================================
# TEST PATIENTS (3 tests)
# ============================================

class TestPatients:
    def test_patients_page(self, logged_in_driver):
        """TC9: Patients page loads"""
        logged_in_driver.get(f"{BASE_URL}/patients")
        WebDriverWait(logged_in_driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, "body"))
        )
        assert "patient" in logged_in_driver.page_source.lower()

    def test_patients_list_displayed(self, logged_in_driver):
        """TC10: Patient list shown"""
        logged_in_driver.get(f"{BASE_URL}/patients")
        page = logged_in_driver.page_source.lower()
        assert "table" in page or "card" in page or "patient" in page

    def test_add_patient_button(self, logged_in_driver):
        """TC11: Add patient button exists"""
        logged_in_driver.get(f"{BASE_URL}/patients")
        buttons = logged_in_driver.find_elements(By.TAG_NAME, "button")
        links = logged_in_driver.find_elements(By.TAG_NAME, "a")
        all_clickable = buttons + links
        has_add = any("add" in (b.text + b.get_attribute("textContent")).lower() for b in all_clickable)
        assert has_add


# ============================================
# TEST DOCTORS (2 tests)
# ============================================

class TestDoctors:
    def test_doctors_page(self, logged_in_driver):
        """TC12: Doctors page loads"""
        logged_in_driver.get(f"{BASE_URL}/doctors")
        assert "doctor" in logged_in_driver.page_source.lower()

    def test_doctor_specializations(self, logged_in_driver):
        """TC13: Specializations visible"""
        logged_in_driver.get(f"{BASE_URL}/doctors")
        specs = ["cardiology", "pediatrics", "orthopedics"]
        page = logged_in_driver.page_source.lower()
        found = sum(1 for s in specs if s in page)
        assert found >= 1


# ============================================
# TEST APPOINTMENTS (2 tests)
# ============================================

class TestAppointments:
    def test_appointments_page(self, logged_in_driver):
        """TC14: Appointments page loads"""
        logged_in_driver.get(f"{BASE_URL}/appointments")
        assert "appointment" in logged_in_driver.page_source.lower()

    def test_appointment_status(self, logged_in_driver):
        """TC15: Appointment status shown"""
        logged_in_driver.get(f"{BASE_URL}/appointments")
        statuses = ["scheduled", "completed", "cancelled"]
        page = logged_in_driver.page_source.lower()
        found = sum(1 for s in statuses if s in page)
        assert found >= 1


# ============================================
# TEST BILLS (1 test)
# ============================================

class TestBills:
    def test_bills_page(self, logged_in_driver):
        """TC16: Bills page loads"""
        logged_in_driver.get(f"{BASE_URL}/bills")
        assert "bill" in logged_in_driver.page_source.lower()