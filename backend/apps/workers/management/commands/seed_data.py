"""
Commande de simulation — BOTO SA, Mine d'or, Kédougou, Sénégal
Usage: python manage.py seed_data
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = "Peuple la base avec des données de simulation réalistes pour BOTO SA"

    def handle(self, *args, **options):
        self.stdout.write("=== Initialisation des données BOTO SA ===\n")
        self._create_departments()
        self._create_positions()
        self._create_workers()
        self._create_appointments()
        self._create_medical_data()
        self._create_accidents()
        self._create_occupational()
        self.stdout.write(self.style.SUCCESS("\nOK Simulation terminée avec succès !"))

    # ── Départements ──────────────────────────────────────────────────────────

    def _create_departments(self):
        from apps.workers.models import Department
        self.stdout.write("  > Départements...")
        depts = [
            dict(name="Direction des Mines", code="MINE", manager_name="Ibrahima Kouyaté", site_location="Zone mine principale"),
            dict(name="Traitement du Minerai", code="PROC", manager_name="Boubacar Diallo", site_location="Usine de traitement"),
            dict(name="Maintenance & Équipements", code="MAINT", manager_name="Lamine Sow", site_location="Atelier central"),
            dict(name="Centrale Électrique", code="ELEC", manager_name="Moussa Camara", site_location="Centrale 23 MW"),
            dict(name="Sécurité HSE", code="HSE", manager_name="Cheikh Mbaye", site_location="Bureau HSE"),
            dict(name="Environnement & Eau", code="ENV", manager_name="Fatoumata Bah", site_location="Station de traitement eau"),
            dict(name="Logistique & Transport", code="LOG", manager_name="Oumar Traoré", site_location="Parc engins"),
            dict(name="Ressources Humaines", code="RH", manager_name="Aminata Diop", site_location="Administration principale"),
            dict(name="Service Médical", code="MED", manager_name="Dr. Mamadou Ndiaye", site_location="Infirmerie centrale"),
            dict(name="Administration & Finance", code="ADMIN", manager_name="Rokhaya Sarr", site_location="Bâtiment administratif"),
        ]
        self.depts = {}
        for d in depts:
            obj, _ = Department.objects.get_or_create(code=d["code"], defaults=d)
            self.depts[d["code"]] = obj
        self.stdout.write(f"    {len(self.depts)} départements créés")

    # ── Postes de travail ─────────────────────────────────────────────────────

    def _create_positions(self):
        from apps.workers.models import JobPosition
        self.stdout.write("  > Postes de travail...")
        positions = [
            dict(title="Mineur — Exploitation à ciel ouvert", code="MIN-ECO", department=self.depts["MINE"], risk_level="VERY_HIGH",
                 description="Extraction et abattage en fosse ouverte. Exposition aux explosifs, poussières siliceuses, bruit."),
            dict(title="Géologue de mine", code="GEO-MINE", department=self.depts["MINE"], risk_level="HIGH",
                 description="Cartographie géologique, prélèvement d'échantillons. Travail en fosse."),
            dict(title="Foreur-Sondeur", code="FOR-SON", department=self.depts["MINE"], risk_level="VERY_HIGH",
                 description="Forage pour abattage à l'explosif. Exposition aux vibrations et silice."),
            dict(title="Opérateur traitement cyanuration", code="OPT-CYA", department=self.depts["PROC"], risk_level="VERY_HIGH",
                 description="Opération de la chaîne de cyanuration pour extraction de l'or. Exposition aux cyanures."),
            dict(title="Technicien traitement minerai", code="TCH-PROC", department=self.depts["PROC"], risk_level="HIGH",
                 description="Broyage, flottation, filtration. Exposition aux produits chimiques."),
            dict(title="Mécanicien engins lourds", code="MEC-ENG", department=self.depts["MAINT"], risk_level="HIGH",
                 description="Entretien des engins (dumpers, pelles hydrauliques). Risque mécanique et chimique."),
            dict(title="Électricien industriel", code="ELEC-IND", department=self.depts["ELEC"], risk_level="HIGH",
                 description="Maintenance électrique haute et basse tension sur la centrale 23 MW."),
            dict(title="Opérateur centrale électrique", code="OPT-CE", department=self.depts["ELEC"], risk_level="HIGH",
                 description="Conduite et surveillance de la centrale électrique à fioul."),
            dict(title="Agent HSE de terrain", code="AGT-HSE", department=self.depts["HSE"], risk_level="MEDIUM",
                 description="Inspection sécurité sur le terrain, contrôle des EPI, rapports d'incidents."),
            dict(title="Chauffeur engins lourds", code="CHF-ENG", department=self.depts["LOG"], risk_level="HIGH",
                 description="Conduite de dumpers, bulldozers et niveleuses en fosse."),
            dict(title="Chauffeur véhicule léger", code="CHF-VL", department=self.depts["LOG"], risk_level="MEDIUM",
                 description="Transport du personnel et des matériaux sur le site."),
            dict(title="Technicien environnement", code="TCH-ENV", department=self.depts["ENV"], risk_level="MEDIUM",
                 description="Surveillance qualité eau, gestion des rejets, suivi du digue à stériles."),
            dict(title="Infirmier(ère) d'entreprise", code="INF-ENT", department=self.depts["MED"], risk_level="LOW",
                 description="Soins de premier secours, consultations infirmières, suivi médical."),
            dict(title="Agent administratif", code="AGT-ADM", department=self.depts["ADMIN"], risk_level="LOW",
                 description="Gestion administrative, accueil, secrétariat."),
            dict(title="Responsable RH", code="RESP-RH", department=self.depts["RH"], risk_level="LOW",
                 description="Gestion des ressources humaines, paie, recrutement."),
        ]
        self.positions = {}
        for p in positions:
            obj, _ = JobPosition.objects.get_or_create(code=p["code"], defaults=p)
            self.positions[p["code"]] = obj
        self.stdout.write(f"    {len(self.positions)} postes créés")

    # ── Travailleurs ──────────────────────────────────────────────────────────

    def _create_workers(self):
        from apps.workers.models import Worker
        self.stdout.write("  > Travailleurs...")

        workers_data = [
            # Mines
            ("Ousmane", "DIALLO", "M", "1985-03-12", "MIN-ECO", "CDI", "MINE", "1982-07-14", "+221 77 512 34 56"),
            ("Ibrahima", "KOUYATÉ", "M", "1990-11-04", "MIN-ECO", "CDI", "MINE", "1982-07-14", "+221 76 234 56 78"),
            ("Mamadou", "COULIBALY", "M", "1988-06-22", "FOR-SON", "CDI", "MINE", "1982-07-14", "+221 70 345 67 89"),
            ("Boubacar", "CAMARA", "M", "1992-01-15", "FOR-SON", "CDI", "MINE", "1982-07-14", "+221 77 456 78 90"),
            ("Samba", "CISSOKHO", "M", "1987-09-30", "MIN-ECO", "CDI", "MINE", "1982-07-14", "+221 76 567 89 01"),
            ("Moussa", "BALDÉ", "M", "1994-04-18", "GEO-MINE", "CDI", "MINE", "1982-07-14", "+221 70 678 90 12"),
            ("Thierno", "BARRY", "M", "1983-12-07", "GEO-MINE", "CDI", "MINE", "1982-07-14", "+221 77 789 01 23"),
            # Traitement
            ("Lamine", "TRAORÉ", "M", "1989-08-25", "OPT-CYA", "CDI", "PROC", "1982-07-14", "+221 76 890 12 34"),
            ("Cheikh", "MBAYE", "M", "1991-02-14", "OPT-CYA", "CDI", "PROC", "1982-07-14", "+221 70 901 23 45"),
            ("Aliou", "SANÉ", "M", "1986-05-03", "TCH-PROC", "CDI", "PROC", "1982-07-14", "+221 77 012 34 56"),
            ("Kadiatou", "KEITA", "F", "1993-10-19", "TCH-PROC", "CDI", "PROC", "1982-07-14", "+221 76 123 45 67"),
            # Maintenance
            ("Modou", "FALL", "M", "1984-07-08", "MEC-ENG", "CDI", "MAINT", "1982-07-14", "+221 70 234 56 78"),
            ("Pape", "NDOYE", "M", "1990-03-27", "MEC-ENG", "CDI", "MAINT", "1982-07-14", "+221 77 345 67 89"),
            ("Souleymane", "DIATTA", "M", "1988-11-16", "MEC-ENG", "CDD", "MAINT", "1982-07-14", "+221 76 456 78 90"),
            # Électricité
            ("Mamadou", "SOW", "M", "1987-04-22", "ELEC-IND", "CDI", "ELEC", "1982-07-14", "+221 70 567 89 01"),
            ("Oumar", "DIALLO", "M", "1992-08-11", "OPT-CE", "CDI", "ELEC", "1982-07-14", "+221 77 678 90 12"),
            # HSE
            ("Abdoulaye", "NDIAYE", "M", "1985-01-30", "AGT-HSE", "CDI", "HSE", "1982-07-14", "+221 76 789 01 23"),
            ("Marème", "GUEYE", "F", "1991-06-09", "AGT-HSE", "CDI", "HSE", "1982-07-14", "+221 70 890 12 34"),
            # Logistique
            ("Ismaïla", "DIOUF", "M", "1986-09-14", "CHF-ENG", "CDI", "LOG", "1982-07-14", "+221 77 901 23 45"),
            ("Babacar", "SARR", "M", "1993-12-01", "CHF-ENG", "CDI", "LOG", "1982-07-14", "+221 76 012 34 56"),
            ("Moustapha", "DIOP", "M", "1990-07-20", "CHF-VL", "CDI", "LOG", "1982-07-14", "+221 70 123 45 67"),
            ("Mariama", "BAH", "F", "1989-03-05", "CHF-VL", "CDD", "LOG", "1982-07-14", "+221 77 234 56 78"),
            # Environnement
            ("Fatoumata", "SIDIBÉ", "F", "1992-05-28", "TCH-ENV", "CDI", "ENV", "1982-07-14", "+221 76 345 67 89"),
            ("Aissatou", "DIALLO", "F", "1994-10-03", "TCH-ENV", "CDI", "ENV", "1982-07-14", "+221 70 456 78 90"),
            # Médical
            ("Rokhaya", "NIANG", "F", "1988-02-17", "INF-ENT", "CDI", "MED", "1982-07-14", "+221 77 567 89 01"),
            ("Aminata", "SOW", "F", "1990-08-12", "INF-ENT", "CDI", "MED", "1982-07-14", "+221 76 678 90 12"),
            # Admin / RH
            ("Penda", "NDOYE", "F", "1987-06-25", "AGT-ADM", "CDI", "ADMIN", "1982-07-14", "+221 70 789 01 23"),
            ("Fatou", "TOURÉ", "F", "1985-11-08", "RESP-RH", "CDI", "RH", "1982-07-14", "+221 77 890 12 34"),
            # Stagiaires
            ("Ibrahima", "SARR", "M", "1999-04-14", "GEO-MINE", "INTERN", "MINE", "1982-07-14", "+221 76 901 23 45"),
            ("Ndeye", "DIOP", "F", "2000-01-22", "TCH-PROC", "INTERN", "PROC", "1982-07-14", "+221 70 012 34 56"),
        ]

        self.workers = []
        for i, (fn, ln, gender, dob, pos_code, contract, dept_code, hire, phone) in enumerate(workers_data):
            mat = f"BTW-{2020 + (i // 10):04d}-{(i % 10) + 1:03d}"
            w, _ = Worker.objects.get_or_create(
                matricule=mat,
                defaults=dict(
                    first_name=fn, last_name=ln, gender=gender,
                    date_of_birth=date.fromisoformat(dob),
                    hire_date=date(2020 + random.randint(0, 4), random.randint(1, 12), random.randint(1, 28)),
                    contract_type=contract,
                    department=self.depts[dept_code],
                    job_position=self.positions[pos_code],
                    phone=phone,
                    blood_type=random.choice(["A+", "B+", "O+", "AB+", "A-", "O-"]),
                    is_active=True,
                )
            )
            self.workers.append(w)

        self.stdout.write(f"    {len(self.workers)} travailleurs créés")

    # ── Rendez-vous ───────────────────────────────────────────────────────────

    def _create_appointments(self):
        from apps.appointments.models import Appointment, AppointmentType
        from apps.accounts.models import User
        self.stdout.write("  > Rendez-vous...")

        # Types de RV
        appt_types_data = [
            dict(name="Visite médicale d'embauche", duration_minutes=60, color_hex="#3B82F6", requires_preparation=True),
            dict(name="Visite médicale périodique", duration_minutes=45, color_hex="#10B981", requires_preparation=False),
            dict(name="Consultation spontanée", duration_minutes=30, color_hex="#F59E0B", requires_preparation=False),
            dict(name="Visite de reprise", duration_minutes=45, color_hex="#8B5CF6", requires_preparation=False),
            dict(name="Surveillance SMS", duration_minutes=60, color_hex="#EF4444", requires_preparation=True),
        ]
        self.appt_types = []
        for at in appt_types_data:
            obj, _ = AppointmentType.objects.get_or_create(name=at["name"], defaults=at)
            self.appt_types.append(obj)

        doctor = User.objects.filter(role__in=["DOCTOR", "SUPER_ADMIN"]).first()
        if not doctor:
            self.stdout.write("    ! Aucun médecin trouvé — rendez-vous ignorés")
            return

        today = date.today()
        statuses = ["PENDING", "CONFIRMED", "COMPLETED", "COMPLETED", "COMPLETED"]

        for i, worker in enumerate(self.workers[:20]):
            delta = random.randint(-30, 14)
            appt_date = today + timedelta(days=delta)
            Appointment.objects.get_or_create(
                worker=worker,
                appointment_type=random.choice(self.appt_types),
                defaults=dict(
                    doctor=doctor,
                    scheduled_at=timezone.make_aware(
                        timezone.datetime(appt_date.year, appt_date.month, appt_date.day,
                                          random.choice([8, 9, 10, 11, 14, 15, 16]), 0)
                    ),
                    status=random.choice(statuses),
                    reason="Visite réglementaire annuelle - BOTO SA",
                    created_by=doctor,
                )
            )

        self.stdout.write(f"    20 rendez-vous créés")

    # ── Actes médicaux, consultations, visites ────────────────────────────────

    def _create_medical_data(self):
        from apps.medical_acts.models import ClinicalEncounter, VitalSigns
        from apps.consultations.models import Consultation
        from apps.medical_visits.models import MedicalVisit, AptitudeCertificate
        from apps.accounts.models import User
        self.stdout.write("  > Actes médicaux & visites...")

        doctor = User.objects.filter(role__in=["DOCTOR", "SUPER_ADMIN"]).first()
        if not doctor:
            self.stdout.write("    ! Aucun médecin trouvé")
            return

        today = date.today()
        self.encounters = []

        # Visites médicales périodiques pour tous les travailleurs
        for worker in self.workers:
            enc_date = today - timedelta(days=random.randint(1, 180))
            enc, created = ClinicalEncounter.objects.get_or_create(
                worker=worker,
                encounter_type="MEDICAL_VISIT",
                encounter_date=enc_date,
                defaults=dict(
                    doctor=doctor,
                    encounter_time="08:30:00",
                    status="COMPLETED",
                )
            )
            if created:
                # Constantes vitales
                VitalSigns.objects.create(
                    encounter=enc,
                    weight_kg=round(random.uniform(58, 90), 1),
                    height_cm=random.randint(162, 185),
                    bp_systolic=random.randint(110, 135),
                    bp_diastolic=random.randint(65, 85),
                    heart_rate=random.randint(60, 85),
                    temperature=round(random.uniform(36.4, 37.2), 1),
                    oxygen_saturation=random.randint(96, 100),
                )
                # Certificat d'aptitude
                visit_type = "EMBAUCHE" if worker.hire_date and (today - worker.hire_date).days < 90 else "PERIODIQUE"
                mv = MedicalVisit.objects.create(encounter=enc, visit_type=visit_type)

                # Aptitude selon le poste
                high_risk_codes = ["MIN-ECO", "FOR-SON", "OPT-CYA", "MEC-ENG", "ELEC-IND", "CHF-ENG"]
                pos_code = worker.job_position.code if worker.job_position else ""
                if pos_code in high_risk_codes:
                    aptitude = random.choice(["APT", "APT", "APT", "APT_R"])
                else:
                    aptitude = "APT"

                AptitudeCertificate.objects.get_or_create(
                    medical_visit=mv,
                    defaults=dict(
                        aptitude=aptitude,
                        restrictions="Port des EPI obligatoire" if aptitude == "APT_R" else "",
                        next_visit_date=enc_date + timedelta(days=365),
                        valid_until=enc_date + timedelta(days=365),
                        certificate_number=f"BOTO-APT-{enc_date.year}-{enc_date.month:02d}-{worker.pk:04d}",
                        signed_by=doctor,
                    )
                )
            self.encounters.append(enc)

        # Consultations de pathologies courantes (mines)
        pathologies = [
            ("Lombalgie aiguë", "Hernie discale L4-L5", "M54.5", 3),
            ("Toux chronique — exposition poussières", "Pneumopathie irritative", "J70.2", 5),
            ("Hypoacousie — exposition bruit", "Surdité professionnelle bilatérale", "H83.3", 0),
            ("Céphalées — intoxication CO", "Intoxication monoxyde de carbone légère", "T58", 2),
            ("Brûlure chimique main droite", "Brûlure degré 2 — contact NaCN", "T23.2", 7),
            ("Fièvre — paludisme", "Accès palustre simple (Plasmodium falciparum)", "B54", 3),
            ("Douleur genou gauche", "Gonarthrose — travail en fosse", "M17.1", 0),
            ("Conjonctivite", "Conjonctivite irritative — poussières", "H10.3", 1),
            ("HTA stade 1", "Hypertension artérielle essentielle", "I10", 0),
            ("Malaise en poste", "Hypoglycémie — jeûne prolongé", "E16.0", 1),
        ]

        for i, worker in enumerate(random.sample(self.workers, min(15, len(self.workers)))):
            patho = pathologies[i % len(pathologies)]
            enc_date = today - timedelta(days=random.randint(1, 90))
            enc = ClinicalEncounter.objects.create(
                worker=worker, doctor=doctor,
                encounter_date=enc_date,
                encounter_time=f"{random.choice([8,9,10,11,14,15,16])}:00:00",
                encounter_type="CONSULTATION",
                status="COMPLETED",
            )
            VitalSigns.objects.create(
                encounter=enc,
                weight_kg=round(random.uniform(58, 90), 1),
                height_cm=random.randint(162, 185),
                bp_systolic=random.randint(110, 150),
                bp_diastolic=random.randint(65, 95),
                heart_rate=random.randint(60, 95),
                temperature=round(random.uniform(36.5, 38.5), 1),
                oxygen_saturation=random.randint(94, 100),
            )
            Consultation.objects.create(
                encounter=enc,
                chief_complaint=patho[0],
                working_diagnosis=patho[1],
                final_diagnosis=patho[1],
                icd10_code=patho[2],
                sick_leave_days=patho[3],
                referral_needed=patho[3] > 5,
                work_restriction="Éviter port de charges > 10 kg" if "lombal" in patho[0].lower() else "",
                follow_up_date=enc_date + timedelta(days=14) if patho[3] > 0 else None,
            )

        self.stdout.write(f"    {len(self.workers)} visites + 15 consultations créées")

    # ── Accidents du travail ──────────────────────────────────────────────────

    def _create_accidents(self):
        from apps.consultations.models import WorkAccident
        from apps.accounts.models import User
        self.stdout.write("  > Accidents du travail...")

        doctor = User.objects.filter(role__in=["DOCTOR", "SUPER_ADMIN"]).first()
        today = date.today()
        accidents = [
            dict(
                worker=self.workers[0],  # Mineur
                accident_date=today - timedelta(days=45),
                location="Fosse principale — Niveau -15m",
                circumstance="Chute de pierre lors d'une opération d'abattage. Le travailleur n'avait pas évacué la zone de tir à temps.",
                body_part_injured="Épaule droite",
                injury_type="Contusion — déchirure musculaire",
                severity="MODERATE",
                lost_work_days=8,
                is_recognized=True,
            ),
            dict(
                worker=self.workers[8],  # Opérateur cyanuration
                accident_date=today - timedelta(days=90),
                location="Usine de traitement — Zone cyanuration",
                circumstance="Projection accidentelle de solution cyanurée lors du remplissage d'une cuve. EPI non adaptés.",
                body_part_injured="Avant-bras gauche et thorax",
                injury_type="Brûlure chimique degré 1-2",
                severity="MODERATE",
                lost_work_days=12,
                is_recognized=True,
            ),
            dict(
                worker=self.workers[11],  # Mécanicien
                accident_date=today - timedelta(days=20),
                location="Atelier maintenance",
                circumstance="Écrasement de la main lors d'une opération de changement de pneu sur dumper sans immobilisation correcte.",
                body_part_injured="Main gauche — doigts 2 et 3",
                injury_type="Fracture phalange",
                severity="MODERATE",
                lost_work_days=21,
                is_recognized=True,
            ),
            dict(
                worker=self.workers[18],  # Chauffeur engins
                accident_date=today - timedelta(days=7),
                location="Piste d'accès fosse — Km 3",
                circumstance="Accrochage entre deux dumpers sur piste étroite. Collision à faible vitesse.",
                body_part_injured="Nuque — entorse cervicale",
                injury_type="Entorse cervicale",
                severity="MINOR",
                lost_work_days=3,
                is_recognized=False,
            ),
            dict(
                worker=self.workers[3],  # Foreur
                accident_date=today - timedelta(days=130),
                location="Zone de forage — Secteur Est",
                circumstance="Exposition prolongée aux vibrations de la foreuse sans matériel anti-vibratoire adapté.",
                body_part_injured="Poignets et avant-bras",
                injury_type="Syndrome vibratoire — tendinite",
                severity="MINOR",
                lost_work_days=5,
                is_recognized=True,
            ),
        ]

        for a in accidents:
            a["created_by"] = doctor
            WorkAccident.objects.get_or_create(
                worker=a["worker"],
                accident_date=a["accident_date"],
                defaults=a,
            )

        self.stdout.write(f"    {len(accidents)} accidents déclarés")

    # ── Santé au travail ──────────────────────────────────────────────────────

    def _create_occupational(self):
        from apps.occupational.models import WorkRisk, SpecialMedicalSurveillance
        from apps.accounts.models import User
        self.stdout.write("  > Risques & Surveillances médicales spéciales...")

        doctor = User.objects.filter(role__in=["DOCTOR", "SUPER_ADMIN"]).first()
        if not doctor:
            return

        today = date.today()

        # Risques par poste
        risks = [
            dict(job_position=self.positions["MIN-ECO"], risk_type="DUST", risk_agent="Silice cristalline libre (SiO₂)",
                 risk_level=4, preventive_measures="Arrosage des pistes, aspiration à la source, port de masque FFP3",
                 ppe_required="Masque FFP3, lunettes étanches, combinaison anti-poussière"),
            dict(job_position=self.positions["MIN-ECO"], risk_type="NOISE", risk_agent="Explosifs, foreuses, dumpers",
                 risk_level=4, preventive_measures="Protecteurs auditifs obligatoires, rotation des postes",
                 ppe_required="Protecteurs auditifs SNR ≥ 30 dB"),
            dict(job_position=self.positions["FOR-SON"], risk_type="PHYSICAL", risk_agent="Vibrations corps entier et main-bras",
                 risk_level=3, preventive_measures="Foreuses anti-vibrations, limitation temps exposition",
                 ppe_required="Gants anti-vibrations, bottes anti-choc"),
            dict(job_position=self.positions["OPT-CYA"], risk_type="CHEMICAL", risk_agent="Cyanure de sodium (NaCN) — solution 1000 ppm",
                 risk_level=4, preventive_measures="Ventilation forcée, douches oculaires, détecteurs HCN",
                 ppe_required="Combinaison NBP, masque à gaz filtre B-P3, gants nitrile épaisseur 0.4mm"),
            dict(job_position=self.positions["TCH-PROC"], risk_type="CHEMICAL", risk_agent="Acide sulfurique, chaux vive",
                 risk_level=3, preventive_measures="Procédures de manipulation strictes, douches de sécurité",
                 ppe_required="Tablier PVC, lunettes de protection, gants résistants acides"),
            dict(job_position=self.positions["ELEC-IND"], risk_type="PHYSICAL", risk_agent="Électricité haute tension (6,6 kV)",
                 risk_level=3, preventive_measures="Consignation LOTO, contrôle habilitation électrique",
                 ppe_required="Gants isolants classe 2, tapis isolant, écran facial"),
            dict(job_position=self.positions["MEC-ENG"], risk_type="CHEMICAL", risk_agent="Huiles hydrauliques, carburant",
                 risk_level=2, preventive_measures="Ventilation atelier, bacs de rétention",
                 ppe_required="Gants nitrile, tablier imperméable, lunettes de sécurité"),
        ]

        for r in risks:
            WorkRisk.objects.get_or_create(
                job_position=r["job_position"],
                risk_type=r["risk_type"],
                defaults=r,
            )

        # Surveillances médicales spéciales pour travailleurs exposés
        sms_cases = [
            (self.workers[0], "DUST", "Silice cristalline — pneumoconiose"),
            (self.workers[1], "NOISE", "Surdité professionnelle — bruits impulsionnels"),
            (self.workers[2], "PHYSICAL", "Vibrations main-bras — syndrome de Raynaud"),
            (self.workers[3], "PHYSICAL", "Vibrations main-bras"),
            (self.workers[8], "CHEMICAL", "Cyanure de sodium — intoxication chronique"),
            (self.workers[9], "CHEMICAL", "Acide sulfurique — brûlures respiratoires"),
            (self.workers[14], "PHYSICAL", "Électricité haute tension"),
            (self.workers[4], "DUST", "Silice cristalline"),
            (self.workers[5], "CHEMICAL", "Produits cyanurés — surveillance HCN"),
        ]

        for worker, risk_type, risk_agent in sms_cases:
            started = today - timedelta(days=random.randint(30, 500))
            SpecialMedicalSurveillance.objects.get_or_create(
                worker=worker,
                risk_type=risk_type,
                defaults=dict(
                    assigned_doctor=doctor,
                    risk_agent=risk_agent,
                    started_date=started,
                    review_date=started + timedelta(days=180),
                    frequency_months=6,
                    status="ACTIVE",
                    notes=f"Surveillance en cours — exposition confirmée au poste {worker.job_position.title if worker.job_position else ''}",
                )
            )

        self.stdout.write(f"    {len(risks)} risques + {len(sms_cases)} SMS créés")
