"""
Script de seed data pour Boto SA ERP
Lance avec: python manage.py shell < seed_data.py
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')

from apps.accounts.models import User, Role
from apps.workers.models import Department, JobPosition, Worker
from apps.medical_acts.models import ClinicalEncounter, VitalSigns
from apps.consultations.models import Consultation
from datetime import date, timedelta
import random

print("=== Création des utilisateurs ===")

users_data = [
    {"email": "admin@boto-sa.sn", "first_name": "Mamadou", "last_name": "Diallo", "role": Role.SUPER_ADMIN, "is_staff": True, "is_superuser": True, "phone": "77 100 00 01", "department": "Direction"},
    {"email": "docteur@boto-sa.sn", "first_name": "Aminata", "last_name": "Ndiaye", "role": Role.DOCTOR, "phone": "77 200 00 02", "department": "Service Médical", "specialization": "Médecine du Travail", "license_number": "MED-2024-001"},
    {"email": "infirmier@boto-sa.sn", "first_name": "Ibrahima", "last_name": "Sow", "role": Role.NURSE, "phone": "77 300 00 03", "department": "Service Médical", "specialization": "Soins Infirmiers"},
    {"email": "technicien@boto-sa.sn", "first_name": "Fatou", "last_name": "Diop", "role": Role.TECHNICIAN, "phone": "77 400 00 04", "department": "Laboratoire"},
    {"email": "rh@boto-sa.sn", "first_name": "Ousmane", "last_name": "Sarr", "role": Role.HR_ADMIN, "phone": "77 500 00 05", "department": "Ressources Humaines"},
    {"email": "lecteur@boto-sa.sn", "first_name": "Aissatou", "last_name": "Ba", "role": Role.VIEWER, "phone": "77 600 00 06", "department": "Direction"},
]

created_users = []
for u in users_data:
    user, created = User.objects.get_or_create(email=u["email"], defaults=u)
    if created:
        user.set_password("boto2024!")
        user.save()
        print(f"  [OK] {user}")
    else:
        print(f"  [EXISTE] {user}")
    created_users.append(user)

doctor = User.objects.get(email="docteur@boto-sa.sn")

print("\n=== Création des départements ===")

departments_data = [
    {"name": "Production", "code": "PROD", "manager_name": "Cheikh Mbaye", "site_location": "Usine A"},
    {"name": "Maintenance", "code": "MAINT", "manager_name": "Lamine Diallo", "site_location": "Atelier B"},
    {"name": "Logistique", "code": "LOG", "manager_name": "Ndéye Fall", "site_location": "Entrepôt C"},
    {"name": "Administration", "code": "ADMIN", "manager_name": "Mariama Ndiaye", "site_location": "Siège"},
    {"name": "Sécurité", "code": "SEC", "manager_name": "Alioune Touré", "site_location": "Poste de sécurité"},
    {"name": "Qualité", "code": "QUAL", "manager_name": "Binta Kouyaté", "site_location": "Labo qualité"},
]

depts = {}
for d in departments_data:
    dept, created = Department.objects.get_or_create(code=d["code"], defaults=d)
    depts[d["code"]] = dept
    print(f"  [{'OK' if created else 'EXISTE'}] {dept}")

print("\n=== Création des postes de travail ===")

positions_data = [
    {"title": "Opérateur de production", "code": "OP-PROD", "department": depts["PROD"], "risk_level": "HIGH"},
    {"title": "Technicien de maintenance", "code": "TECH-MAINT", "department": depts["MAINT"], "risk_level": "HIGH"},
    {"title": "Magasinier", "code": "MAG-LOG", "department": depts["LOG"], "risk_level": "MEDIUM"},
    {"title": "Agent administratif", "code": "AGENT-ADMIN", "department": depts["ADMIN"], "risk_level": "LOW"},
    {"title": "Agent de sécurité", "code": "AGENT-SEC", "department": depts["SEC"], "risk_level": "MEDIUM"},
    {"title": "Contrôleur qualité", "code": "CTRL-QUAL", "department": depts["QUAL"], "risk_level": "MEDIUM"},
    {"title": "Chef d'équipe production", "code": "CHEF-PROD", "department": depts["PROD"], "risk_level": "HIGH"},
    {"title": "Soudeur", "code": "SOUD-MAINT", "department": depts["MAINT"], "risk_level": "VERY_HIGH"},
]

positions = {}
for p in positions_data:
    pos, created = JobPosition.objects.get_or_create(code=p["code"], defaults=p)
    positions[p["code"]] = pos
    print(f"  [{'OK' if created else 'EXISTE'}] {pos}")

print("\n=== Création des travailleurs ===")

workers_data = [
    {"matricule": "BT-001", "first_name": "Moussa", "last_name": "Camara", "gender": "M", "date_of_birth": date(1985, 3, 15), "hire_date": date(2015, 6, 1), "contract_type": "CDI", "department": depts["PROD"], "job_position": positions["OP-PROD"], "phone": "77 111 11 01", "blood_type": "A+"},
    {"matricule": "BT-002", "first_name": "Rokhaya", "last_name": "Diène", "gender": "F", "date_of_birth": date(1990, 7, 22), "hire_date": date(2018, 3, 1), "contract_type": "CDI", "department": depts["MAINT"], "job_position": positions["TECH-MAINT"], "phone": "77 111 11 02", "blood_type": "O+"},
    {"matricule": "BT-003", "first_name": "Abdoulaye", "last_name": "Faye", "gender": "M", "date_of_birth": date(1988, 11, 5), "hire_date": date(2016, 9, 15), "contract_type": "CDI", "department": depts["LOG"], "job_position": positions["MAG-LOG"], "phone": "77 111 11 03", "blood_type": "B+"},
    {"matricule": "BT-004", "first_name": "Mame Diarra", "last_name": "Mbaye", "gender": "F", "date_of_birth": date(1993, 2, 28), "hire_date": date(2020, 1, 6), "contract_type": "CDI", "department": depts["ADMIN"], "job_position": positions["AGENT-ADMIN"], "phone": "77 111 11 04", "blood_type": "AB+"},
    {"matricule": "BT-005", "first_name": "Pape", "last_name": "Gueye", "gender": "M", "date_of_birth": date(1982, 8, 10), "hire_date": date(2012, 4, 1), "contract_type": "CDI", "department": depts["SEC"], "job_position": positions["AGENT-SEC"], "phone": "77 111 11 05", "blood_type": "O-"},
    {"matricule": "BT-006", "first_name": "Khady", "last_name": "Seck", "gender": "F", "date_of_birth": date(1995, 5, 18), "hire_date": date(2021, 7, 1), "contract_type": "CDD", "department": depts["QUAL"], "job_position": positions["CTRL-QUAL"], "phone": "77 111 11 06", "blood_type": "A-"},
    {"matricule": "BT-007", "first_name": "Babacar", "last_name": "Niang", "gender": "M", "date_of_birth": date(1980, 12, 3), "hire_date": date(2010, 1, 1), "contract_type": "CDI", "department": depts["PROD"], "job_position": positions["CHEF-PROD"], "phone": "77 111 11 07", "blood_type": "B-"},
    {"matricule": "BT-008", "first_name": "Sokhna", "last_name": "Thiam", "gender": "F", "date_of_birth": date(1987, 9, 25), "hire_date": date(2017, 11, 1), "contract_type": "CDI", "department": depts["MAINT"], "job_position": positions["SOUD-MAINT"], "phone": "77 111 11 08", "blood_type": "O+"},
    {"matricule": "BT-009", "first_name": "El Hadj", "last_name": "Konaté", "gender": "M", "date_of_birth": date(1992, 6, 14), "hire_date": date(2019, 5, 1), "contract_type": "CDI", "department": depts["PROD"], "job_position": positions["OP-PROD"], "phone": "77 111 11 09", "blood_type": "A+"},
    {"matricule": "BT-010", "first_name": "Awa", "last_name": "Traoré", "gender": "F", "date_of_birth": date(1997, 1, 8), "hire_date": date(2022, 9, 1), "contract_type": "INTERN", "department": depts["QUAL"], "job_position": positions["CTRL-QUAL"], "phone": "77 111 11 10", "blood_type": "AB-"},
]

workers = []
for w in workers_data:
    worker, created = Worker.objects.get_or_create(matricule=w["matricule"], defaults=w)
    workers.append(worker)
    print(f"  [{'OK' if created else 'EXISTE'}] {worker}")

print("\n=== Création de consultations médicales ===")

from datetime import time as dtime

complaints = [
    ("Douleurs lombaires", "Lombalgie chronique liée au travail", "Z57.5"),
    ("Céphalées fréquentes", "Céphalées de tension", "G44.2"),
    ("Toux persistante", "Rhinopharyngite aiguë", "J00"),
    ("Douleurs articulaires", "Arthralgie du genou droit", "M25.3"),
    ("Fatigue chronique", "Syndrome d'épuisement professionnel", "Z73.0"),
]

for i, worker in enumerate(workers[:5]):
    encounter, created = ClinicalEncounter.objects.get_or_create(
        worker=worker,
        encounter_type="CONSULTATION",
        defaults={
            "doctor": doctor,
            "encounter_date": date.today() - timedelta(days=random.randint(1, 60)),
            "encounter_time": dtime(8 + i, 0),
            "status": "COMPLETED",
        }
    )
    if created:
        vitals = VitalSigns.objects.create(
            encounter=encounter,
            weight_kg=round(random.uniform(60, 90), 1),
            height_cm=round(random.uniform(160, 185), 1),
            bp_systolic=random.randint(110, 135),
            bp_diastolic=random.randint(70, 90),
            heart_rate=random.randint(65, 85),
            temperature=round(random.uniform(36.5, 37.2), 1),
            oxygen_saturation=random.randint(97, 100),
        )
        complaint, history, icd = complaints[i]
        Consultation.objects.create(
            encounter=encounter,
            chief_complaint=complaint,
            disease_history=history,
            vital_signs=vitals,
            final_diagnosis=history,
            icd10_code=icd,
            treatment_plan="Traitement symptomatique + suivi dans 3 mois",
        )
        print(f"  [OK] Consultation créée pour {worker.full_name}")
    else:
        print(f"  [EXISTE] Consultation pour {worker.full_name}")

print("\n=== Résumé ===")
print(f"  Utilisateurs : {User.objects.count()}")
print(f"  Départements : {Department.objects.count()}")
print(f"  Postes       : {JobPosition.objects.count()}")
print(f"  Travailleurs : {Worker.objects.count()}")
print(f"  Consultations: {Consultation.objects.count()}")
print("\nMot de passe de tous les utilisateurs : boto2024!")
print("Admin: admin@boto-sa.sn / boto2024!")
