# Student Registry Data for Postman

## Method 1: Individual POST Requests

**Endpoint:** `POST http://localhost:3000/general/student`  
**Content-Type:** `application/json`

### Course Distribution:

- **Course 18 (Instroomtraject - €695)**: 9 students
- **Course 19 (Doorstroomprogramma - €1195)**: 8 students
- **Course 20 (Hifdh Voorbereiding - €1495)**: 8 students

### Individual Request Bodies:

**Student 1:**

```json
{
  "first_name": "Yusuf",
  "last_name": "Al-Hassan",
  "birth_date": "2008-03-15",
  "gender": "Man",
  "address": "Moskeestraat 45",
  "postal_code": "2514 BC",
  "city": "Den Haag",
  "phone": "0612345678",
  "parent_name": "Fatima Al-Hassan",
  "parent_email": "f.alhassan@email.com",
  "lesson_package": "Basis",
  "payment_method": "iDEAL",
  "sosnumber": "2008031501",
  "enrollment_status": true
}
```

**Student 2:**

```json
{
  "first_name": "Aisha",
  "last_name": "Bakr",
  "birth_date": "2009-07-22",
  "gender": "Vrouw",
  "address": "Tulpenstraat 12",
  "postal_code": "1012 AB",
  "city": "Amsterdam",
  "phone": "0687654321",
  "parent_name": "Omar Bakr",
  "parent_email": "o.bakr@email.com",
  "lesson_package": "Uitgebreid",
  "payment_method": "Bankoverschrijving",
  "sosnumber": "2009072201",
  "enrollment_status": true
}
```

**Student 3:**

```json
{
  "first_name": "Mohammed",
  "last_name": "Qureshi",
  "birth_date": "2007-11-08",
  "gender": "Man",
  "address": "Rozengracht 88",
  "postal_code": "1016 NH",
  "city": "Amsterdam",
  "phone": "0634567890",
  "parent_name": "Zainab Qureshi",
  "parent_email": "z.qureshi@email.com",
  "lesson_package": "Intensief",
  "payment_method": "iDEAL",
  "sosnumber": "2007110801",
  "enrollment_status": true
}
```

**Student 4:**

```json
{
  "first_name": "Khadija",
  "last_name": "Rahman",
  "birth_date": "2008-09-14",
  "gender": "Vrouw",
  "address": "Hoofdstraat 156",
  "postal_code": "3011 EP",
  "city": "Rotterdam",
  "phone": "0645678901",
  "parent_name": "Abdul Rahman",
  "parent_email": "a.rahman@email.com",
  "lesson_package": "Basis",
  "payment_method": "Creditcard",
  "sosnumber": "2008091401",
  "enrollment_status": true
}
```

**Student 5:**

```json
{
  "first_name": "Ibrahim",
  "last_name": "Mansour",
  "birth_date": "2009-01-25",
  "gender": "Man",
  "address": "Kerkstraat 33",
  "postal_code": "5611 GH",
  "city": "Eindhoven",
  "phone": "0656789012",
  "parent_name": "Layla Mansour",
  "parent_email": "l.mansour@email.com",
  "lesson_package": "Uitgebreid",
  "payment_method": "iDEAL",
  "sosnumber": "2009012501",
  "enrollment_status": true
}
```

## Method 2: Bulk Import Script

You can also use this Node.js script to bulk insert all students:

```javascript
const students = [
  // ... paste the entire JSON array from student_registry_data.json
];

async function bulkInsertStudents() {
  for (const student of students) {
    try {
      const response = await fetch('http://localhost:3000/general/student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(student),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(
          `✅ Created student: ${student.first_name} ${student.last_name} (ID: ${result.id})`
        );
      } else {
        console.log(
          `❌ Failed to create student: ${student.first_name} ${student.last_name}`
        );
      }
    } catch (error) {
      console.error(
        `Error creating student ${student.first_name} ${student.last_name}:`,
        error
      );
    }

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

bulkInsertStudents();
```

## Method 3: Postman Collection Runner

1. Import the JSON file as a collection
2. Set up environment variables for the base URL
3. Use Postman's Collection Runner to execute all requests

## After Creating Students

After creating all students, you can assign them to courses using:

**Endpoint:** `PUT http://localhost:3000/general/student/{student_id}`

Example to assign student to course:

```json
{
  "course_id": 18
}
```

## Data Summary

- **Total Students:** 25
- **Age Range:** 15-18 years old (born 2007-2009)
- **Cities:** Amsterdam, Rotterdam, Den Haag, Eindhoven, Utrecht, Nijmegen, Leiden
- **Payment Methods:** iDEAL, Bankoverschrijving, Creditcard
- **Lesson Packages:** Basis, Uitgebreid, Intensief
- **Gender Distribution:** 13 Male, 12 Female
- **All students have:** Valid Dutch postal codes, phone numbers, parent contact info, and enrollment status set to true
