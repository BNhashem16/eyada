# Eyada Clinic Booking API - Postman Documentation

## Collections

| File | Description |
|------|-------------|
| `Eyada_Complete_API.postman_collection.json` | **Main collection with all filters** |
| `Eyada_API_Collection.postman_collection.json` | Auth, Specialties, Locations |
| `Eyada_Part2_*.json` | Doctors, Patients, Clinics |
| `Eyada_Part3_*.json` | Appointments |

## Quick Start

```bash
npm run start:dev
```

Then import the collection in Postman.

---

## Search & Filter Reference

### Doctors: `GET /doctors`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `specialtyId` | UUID | Filter by specialty |
| `cityId` | UUID | Filter by city |
| `stateId` | UUID | Filter by state |
| `search` | string | Search by doctor name (Arabic/English) |
| `minRating` | number | Minimum rating (0-5) |
| `priceMin` | number | Minimum service price |
| `priceMax` | number | Maximum service price |

**Example:**
```
GET /doctors?specialtyId=xxx&minRating=4&priceMax=500
```

---

### Clinics: `GET /clinics`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `cityId` | UUID | Filter by city |
| `stateId` | UUID | Filter by state |
| `specialtyId` | UUID | Filter by doctor's specialty |
| `search` | string | Search by clinic name, address, or doctor name |
| `priceMin` | number | Minimum service price |
| `priceMax` | number | Maximum service price |
| `minRating` | number | Minimum doctor rating |
| `latitude` | number | User's latitude |
| `longitude` | number | User's longitude |
| `radiusKm` | number | Search radius in kilometers |

**Example - Distance Search:**
```
GET /clinics?latitude=30.0626&longitude=31.3456&radiusKm=5
```

---

### Patient Appointments: `GET /patients/appointments`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `status` | enum | PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW |
| `paymentStatus` | enum | PENDING, PAID, REFUNDED |
| `dateFrom` | date | Start date (YYYY-MM-DD) |
| `dateTo` | date | End date (YYYY-MM-DD) |
| `clinicId` | UUID | Filter by clinic |
| `doctorId` | UUID | Filter by doctor |
| `upcoming` | boolean | Only future appointments |
| `forFamilyMember` | boolean | true = family only, false = self only |

**Example:**
```
GET /patients/appointments?upcoming=true&status=CONFIRMED
```

---

### Doctor Appointments: `GET /doctors/appointments`

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number |
| `limit` | number | Items per page |
| `clinicId` | UUID | Filter by specific clinic |
| `status` | enum | Appointment status |
| `paymentStatus` | enum | Payment status |
| `date` | date | Specific date (YYYY-MM-DD) |
| `dateFrom` | date | Start date |
| `dateTo` | date | End date |
| `search` | string | Search by patient name or booking number |
| `serviceTypeId` | UUID | Filter by service type |
| `upcoming` | boolean | Only future appointments |

**Example:**
```
GET /doctors/appointments?date=2024-01-20&status=PENDING
GET /doctors/appointments?search=أحمد&paymentStatus=PENDING
```

---

### Secretary Appointments: `GET /secretary/appointments`

Same parameters as Doctor Appointments.

---

## Pagination Response Format

```json
{
  "data": [...],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## Status Values

### Appointment Status
- `PENDING` - Awaiting confirmation
- `CONFIRMED` - Confirmed by doctor/secretary
- `CHECKED_IN` - Patient arrived
- `COMPLETED` - Appointment completed
- `CANCELLED` - Cancelled
- `NO_SHOW` - Patient didn't show up

### Payment Status
- `PENDING` - Not paid
- `PAID` - Payment received
- `REFUNDED` - Payment refunded

---

## Validation Rules

### Phone Number
Egyptian format: `01[0125]XXXXXXXX`
- 01012345678 ✓
- 01112345678 ✓
- 01212345678 ✓
- 01512345678 ✓

### Password
- Min 8 characters, max 50
- Must have: uppercase, lowercase, number OR special char

### Time Format
24-hour: `HH:mm` (e.g., `09:00`, `14:30`)

### Date Format
ISO 8601: `YYYY-MM-DD` (e.g., `2024-01-20`)
