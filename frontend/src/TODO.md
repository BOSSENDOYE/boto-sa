# Implementation Plan - Boto SA Features

## Phase 1: Toast System ✅ [IN PROGRESS]
- [x] Create frontend/src/hooks/useToast.ts
- [x] Create frontend/src/components/ui/ToastProvider.tsx  
- [] Update frontend/src/index.css (add animation)
- [] Update frontend/src/App.tsx (wrap ToastProvider + routes)

## Phase 2: Notifications Backend
- [] Create backend/apps/notifications/models.py
- [] Create backend/apps/notifications/serializers.py
- [] Create backend/apps/notifications/views.py
- [] Create backend/apps/notifications/urls.py  
- [] Update backend/config/urls.py

## Phase 3: Profile + Notifications Frontend
- [] Create frontend/src/pages/Profile.tsx
- [] Create frontend/src/pages/Notifications.tsx
- [] Update frontend/src/components/Nav.tsx (bell + links)

## Phase 4: Toast Integration (9 pages)
- [] Workers.tsx, Users.tsx, WorkAccidents.tsx, Activities.tsx, Departments.tsx
- [] Encounters.tsx, Consultations.tsx, Appointments.tsx, Occupational.tsx, MedicalVisits.tsx

## Phase 5: CRUD Updates
- [] NursingActs.tsx (4 tabs edit/delete)
- [] MedicalVisits.tsx (delete)
- [] JobSheet.tsx (SheetsTab + VisitsTab CRUD) 
- [] Explorations.tsx (full CRUD)
- [] Reports.tsx (delete)

## Phase 6: Features
- [] Dashboard.tsx (Recharts)
- [] Appointments.tsx (calendar toggle)
- [] Consultations.tsx + WorkAccidents.tsx (date filters)
- [] Consultations.tsx (PDF export)
- [] URL pagination: Workers/Appts/Consults/Encounters

## Followup
- Backend migrations
- Test all features

