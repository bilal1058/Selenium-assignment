from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import engine, Base, get_db
from .routes import patient, doctor, appointment, billing, auth
from .config import get_settings
from .models.user import User
from .auth import get_password_hash

# Create database tables
Base.metadata.create_all(bind=engine)

settings = get_settings()

app = FastAPI(
    title="Hospital Management System",
    description="A comprehensive hospital management system with Patient, Doctor, Appointment, and Billing modules",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../static/build/static")), name="static")
# Include routers
app.include_router(auth.router)  # Auth routes (no /api prefix as it's already in router)
app.include_router(patient.router, prefix="/api")
app.include_router(doctor.router, prefix="/api")
app.include_router(appointment.router, prefix="/api")
app.include_router(billing.router, prefix="/api")

@app.on_event("startup")
def create_default_admin():
    """Create default admin user on startup if not exists"""
    from .database import SessionLocal
    from .models.doctor import Doctor
    from .models.patient import Patient
    from .models.appointment import Appointment
    from .models.billing import Prescription
    from datetime import date, timedelta
    db = SessionLocal()
    try:
        # Create admin user
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin_user = User(
                username="admin",
                email="admin@hospital.com",
                password_hash=get_password_hash("admin123"),
                full_name="System Administrator",
                phone="03001234567",
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Default admin user created: admin / admin123")
        
        # Create sample doctors
        sample_doctors = [
            {"first_name": "Ahmed", "last_name": "Khan", "specialization": "Cardiology", "email": "ahmed.khan@hospital.com", "phone": "03111234567", "experience_years": 15, "consultation_fee": 2500},
            {"first_name": "Fatima", "last_name": "Ali", "specialization": "Pediatrics", "email": "fatima.ali@hospital.com", "phone": "03221234567", "experience_years": 10, "consultation_fee": 2000},
            {"first_name": "Usman", "last_name": "Raza", "specialization": "Orthopedics", "email": "usman.raza@hospital.com", "phone": "03331234567", "experience_years": 12, "consultation_fee": 3000},
        ]
        
        for doc_data in sample_doctors:
            existing_doc = db.query(Doctor).filter(Doctor.email == doc_data["email"]).first()
            if not existing_doc:
                doctor = Doctor(**doc_data)
                db.add(doctor)
                db.commit()
                db.refresh(doctor)

            linked_doctor = db.query(Doctor).filter(Doctor.email == doc_data["email"]).first()

            # Create or link user account for doctor
            username = f"dr.{doc_data['first_name'].lower()}"
            existing_user = db.query(User).filter(User.username == username).first()
            if not existing_user:
                doc_user = User(
                    username=username,
                    email=doc_data["email"],
                    password_hash=get_password_hash("doctor123"),
                    full_name=f"Dr. {doc_data['first_name']} {doc_data['last_name']}",
                    phone=doc_data["phone"],
                    role="doctor",
                    doctor_id=linked_doctor.id if linked_doctor else None,
                    is_active=True
                )
                db.add(doc_user)
                db.commit()
                print(f"Doctor user created: {username} / doctor123")
            elif existing_user.role == "doctor" and linked_doctor and existing_user.doctor_id != linked_doctor.id:
                existing_user.doctor_id = linked_doctor.id
                db.commit()
        
        # Create receptionist user
        receptionist = db.query(User).filter(User.username == "receptionist").first()
        if not receptionist:
            rec_user = User(
                username="receptionist",
                email="reception@hospital.com",
                password_hash=get_password_hash("reception123"),
                full_name="Front Desk",
                phone="03441234567",
                role="receptionist",
                is_active=True
            )
            db.add(rec_user)
            db.commit()
            print("Receptionist user created: receptionist / reception123")

        # Seed one upcoming appointment + one prescription per doctor account if missing
        first_patient = db.query(Patient).first()
        if first_patient:
            doctor_users = db.query(User).filter(User.role == "doctor", User.doctor_id.isnot(None)).all()
            for idx, doctor_user in enumerate(doctor_users):
                has_appointment = db.query(Appointment).filter(Appointment.doctor_id == doctor_user.doctor_id).first()
                if not has_appointment:
                    appt = Appointment(
                        patient_id=first_patient.id,
                        doctor_id=doctor_user.doctor_id,
                        appointment_date=date.today() + timedelta(days=idx + 1),
                        appointment_time="10:00",
                        status="scheduled",
                        reason="Follow-up consultation"
                    )
                    db.add(appt)
                    db.commit()

                has_rx = db.query(Prescription).filter(Prescription.doctor_id == doctor_user.doctor_id).first()
                if not has_rx:
                    rx = Prescription(
                        patient_id=first_patient.id,
                        doctor_id=doctor_user.doctor_id,
                        prescription_date=date.today(),
                        diagnosis="General follow-up",
                        symptoms="Routine check",
                        medications="Paracetamol - 500mg - twice daily - 3 days",
                        instructions="Take after meals"
                    )
                    db.add(rx)
                    db.commit()
            
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}

@app.get("/api")
def api_info():
    return {
        "version": "1.0.0",
        "modules": [
            "Patient Management",
            "Doctor Management", 
            "Appointment Management",
            "Billing & Prescriptions"
        ],
        "endpoints": {
            "auth": "/api/auth",
            "patients": "/api/patients",
            "doctors": "/api/doctors",
            "appointments": "/api/appointments",
            "billing": "/api/billing"
        },
        "roles": {
            "admin": "Full access to all modules except doctor-specific actions",
            "doctor": "View/manage own appointments only, create prescriptions",
            "receptionist": "Manage patients, appointments, and billing"
        }
    }

@app.get("/{full_path:path}")
def serve_react_app(full_path: str):
    index_path = os.path.join(os.path.dirname(__file__), "../static/build/index.html")
    return FileResponse(index_path)
