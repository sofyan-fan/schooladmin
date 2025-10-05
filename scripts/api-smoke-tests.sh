#!/usr/bin/env bash

# Reproducible API smoke tests for SchoolAdmin
# Usage:
#   API_BASE=http://localhost:3000 bash scripts/api-smoke-tests.sh
#
# Requirements: curl, jq

API_BASE="${API_BASE:-http://localhost:3000}"
TS="$(date +%s)"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2; exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2; exit 1
fi

echo "API_BASE=$API_BASE"

PASS=()
FAIL=()

rec() {
  local code="$1"; shift
  local name="$1"
  if [[ "$code" -ge 200 && "$code" -lt 300 ]]; then
    echo "PASS: $name ($code)"
    PASS+=("$name")
  else
    echo "FAIL: $name ($code)"
    FAIL+=("$name ($code)")
  fi
}

HTTP_BODY=''
HTTP_CODE=0
http() {
  local method="$1"; shift
  local url="$1"; shift
  local data="${1:-}"
  local res
  if [[ -n "$data" ]]; then
    res=$(curl -s -S -X "$method" -H "Content-Type: application/json" -d "$data" "$url" -w ' HTTPSTATUS:%{http_code}')
  else
    res=$(curl -s -S -X "$method" "$url" -w ' HTTPSTATUS:%{http_code}')
  fi
  HTTP_CODE="${res##*HTTPSTATUS:}"
  HTTP_BODY="${res% HTTPSTATUS:*}"
}

echo "Checking API reachability..."
http GET "$API_BASE/subjects/subjects"
rec "$HTTP_CODE" "PING /subjects/subjects"

# -----------------
# CREATE RESOURCES
# -----------------

# Subject
SUBJ_NAME="Subject-$TS"
POST=$(jq -n --arg name "$SUBJ_NAME" --arg L "L1" --arg M "M1" '{name:$name, levels: [$L], materials: [$M]}')
http POST "$API_BASE/subjects/subjects" "$POST"
rec "$HTTP_CODE" "CREATE Subject"
SUBJ_ID=$(echo "$HTTP_BODY" | jq -r '.id // empty')

# Module (links subject)
MOD_NAME="Module-$TS"
if [[ -n "$SUBJ_ID" ]]; then
  POST=$(jq -n --arg name "$MOD_NAME" --argjson sid "$SUBJ_ID" --arg lvl "L2" --arg mat "M2" '{name:$name, subjects: [{subject_id:$sid, level:$lvl, material:$mat}]}')
  http POST "$API_BASE/courses/modules" "$POST"
  rec "$HTTP_CODE" "CREATE Module"
  MOD_ID=$(echo "$HTTP_BODY" | jq -r '.id // empty')
else
  FAIL+=("CREATE Module (missing SUBJ_ID)")
fi

# Course (links module)
COURSE_NAME="Course-$TS"
if [[ -n "$MOD_ID" ]]; then
  POST=$(jq -n --arg name "$COURSE_NAME" --arg desc "Desc" --argjson price 99.5 --argjson mid "$MOD_ID" '{name:$name, description:$desc, price:$price, module_ids: [$mid]}')
  http POST "$API_BASE/courses/courses" "$POST"
  rec "$HTTP_CODE" "CREATE Course"
  COURSE_ID=$(echo "$HTTP_BODY" | jq -r '.id // empty')
else
  FAIL+=("CREATE Course (missing MOD_ID)")
fi

# Class (class_layout)
CLASS_NAME="Class-$TS"
POST=$(jq -n --arg name "$CLASS_NAME" '{name:$name}')
http POST "$API_BASE/general/class_layouts" "$POST"
rec "$HTTP_CODE" "CREATE Class"
CLASS_ID=$(echo "$HTTP_BODY" | jq -r '.newClassLayout.id // .id // empty')

# Classroom
POST=$(jq -n --arg name "Room-$TS" --argjson capacity 20 --arg desc "desc" '{name:$name, capacity:$capacity, description:$desc}')
http POST "$API_BASE/general/classrooms" "$POST"
rec "$HTTP_CODE" "CREATE Classroom"
CLASSROOM_ID=$(echo "$HTTP_BODY" | jq -r '.id // .classroom.id // .updatedClassroom.id // empty')

# Teacher
POST=$(jq -n --arg fn "T1" --arg ln "Teacher" --arg email "t-$TS@ex.com" --arg phone "123" --arg addr "addr" '{first_name:$fn,last_name:$ln,email:$email,phone:$phone,address:$addr}')
http POST "$API_BASE/general/teacher" "$POST"
rec "$HTTP_CODE" "CREATE Teacher"
TEACHER_ID=$(echo "$HTTP_BODY" | jq -r '.id // empty')

# Roster (needs class, subject, teacher, classroom)
if [[ -n "$CLASS_ID" && -n "$SUBJ_ID" && -n "$TEACHER_ID" && -n "$CLASSROOM_ID" ]]; then
  POST=$(jq -n --argjson class_id "$CLASS_ID" --argjson subject_id "$SUBJ_ID" --argjson teacher_id "$TEACHER_ID" --argjson classroom_id "$CLASSROOM_ID" --arg day "Monday" --arg st "09:00" --arg et "10:00" '{class_id:$class_id,subject_id:$subject_id,teacher_id:$teacher_id,classroom_id:$classroom_id,day_of_week:$day,start_time:$st,end_time:$et}')
  http POST "$API_BASE/dashboard/rosters" "$POST"
  rec "$HTTP_CODE" "CREATE Roster"
  ROSTER_ID=$(echo "$HTTP_BODY" | jq -r '.id // .newRoster.id // empty')
else
  FAIL+=("CREATE Roster (missing IDs)")
fi

# Student
POST=$(jq -n --arg fn "S1" --arg ln "Student" --arg date "2005-01-01T00:00:00Z" --arg gender "M" --arg addr "addr" --arg pc "1000" --arg city "AMS" --arg phone "111" --arg pn "PN" --arg pe "pn@ex.com" --arg lp "LP" --arg pm "card" --arg sos "X" '{first_name:$fn,last_name:$ln,birth_date:$date,gender:$gender,address:$addr,postal_code:$pc,city:$city,phone:$phone,parent_name:$pn,parent_email:$pe,lesson_package:$lp,payment_method:$pm,sosnumber:$sos,enrollment_status:true}')
http POST "$API_BASE/general/student" "$POST"
rec "$HTTP_CODE" "CREATE Student"
STUDENT_ID=$(echo "$HTTP_BODY" | jq -r '.id // empty')

# Determine course_module_subject id (CMS_ID)
CMS_ID=''
if [[ -n "$MOD_ID" ]]; then
  http GET "$API_BASE/courses/modules"
  rec "$HTTP_CODE" "READ Modules"
  CMS_ID=$(echo "$HTTP_BODY" | jq -r ".[] | select(.id==$MOD_ID) | .subjects[0].id // empty")
fi

# Assessment (must use CMS_ID for subject_id)
if [[ -n "$CLASS_ID" && -n "$CMS_ID" ]]; then
  POST=$(jq -n --arg type "test" --arg name "Assess-$TS" --argjson class_id "$CLASS_ID" --argjson subject_id "$CMS_ID" --argjson leverage 1.2 --arg date "2025-09-17T00:00:00Z" --argjson is_central false --arg desc "desc" '{type:$type,name:$name,class_id:$class_id,subject_id:$subject_id,leverage:$leverage,date:$date,is_central:$is_central,description:$desc}')
  http POST "$API_BASE/general/assessments" "$POST"
  rec "$HTTP_CODE" "CREATE Assessment"
  ASSESS_ID=$(echo "$HTTP_BODY" | jq -r '.data.id // .id // empty')
else
  FAIL+=("CREATE Assessment (missing CLASS_ID or CMS_ID)")
fi

# Result
if [[ -n "$STUDENT_ID" && -n "$ASSESS_ID" ]]; then
  POST=$(jq -n --argjson student_id "$STUDENT_ID" --argjson assessment_id "$ASSESS_ID" --argjson grade 85.5 --arg date "2025-09-18T00:00:00Z" '{student_id:$student_id,assessment_id:$assessment_id,grade:$grade,date:$date}')
  http POST "$API_BASE/general/results" "$POST"
  rec "$HTTP_CODE" "CREATE Result"
  RESULT_ID=$(echo "$HTTP_BODY" | jq -r '.id // empty')
else
  FAIL+=("CREATE Result (missing STUDENT_ID or ASSESS_ID)")
fi

# -----------------
# LIST sanity
# -----------------
http GET "$API_BASE/subjects/subjects";      rec "$HTTP_CODE" "LIST Subjects"
http GET "$API_BASE/courses/modules";        rec "$HTTP_CODE" "LIST Modules"
http GET "$API_BASE/courses/courses";        rec "$HTTP_CODE" "LIST Courses"
http GET "$API_BASE/general/classrooms";     rec "$HTTP_CODE" "LIST Classrooms"
http GET "$API_BASE/general/class_layouts";  rec "$HTTP_CODE" "LIST Classes"
http GET "$API_BASE/general/assessments";    rec "$HTTP_CODE" "LIST Assessments"
http GET "$API_BASE/general/results";        rec "$HTTP_CODE" "LIST Results"

# -----------------
# DELETE in safe order
# -----------------

if [[ -n "$RESULT_ID" ]]; then
  http DELETE "$API_BASE/general/results/$RESULT_ID" ""
  rec "$HTTP_CODE" "DELETE Result $RESULT_ID"
fi

if [[ -n "$ASSESS_ID" ]]; then
  http DELETE "$API_BASE/general/assessments/$ASSESS_ID" ""
  rec "$HTTP_CODE" "DELETE Assessment $ASSESS_ID"
fi

if [[ -n "$ROSTER_ID" ]]; then
  http DELETE "$API_BASE/dashboard/rosters/$ROSTER_ID" ""
  rec "$HTTP_CODE" "DELETE Roster $ROSTER_ID"
fi

if [[ -n "$STUDENT_ID" ]]; then
  http DELETE "$API_BASE/general/student/$STUDENT_ID" ""
  rec "$HTTP_CODE" "DELETE Student $STUDENT_ID"
fi

if [[ -n "$COURSE_ID" ]]; then
  http DELETE "$API_BASE/courses/courses/$COURSE_ID" ""
  rec "$HTTP_CODE" "DELETE Course $COURSE_ID"
fi

if [[ -n "$MOD_ID" ]]; then
  http DELETE "$API_BASE/courses/modules/$MOD_ID" ""
  rec "$HTTP_CODE" "DELETE Module $MOD_ID"
fi

if [[ -n "$SUBJ_ID" ]]; then
  http DELETE "$API_BASE/subjects/subjects/$SUBJ_ID" ""
  rec "$HTTP_CODE" "DELETE Subject $SUBJ_ID"
fi

if [[ -n "$CLASSROOM_ID" ]]; then
  http DELETE "$API_BASE/general/classrooms/$CLASSROOM_ID" ""
  rec "$HTTP_CODE" "DELETE Classroom $CLASSROOM_ID"
fi

if [[ -n "$CLASS_ID" ]]; then
  http DELETE "$API_BASE/general/class_layouts/$CLASS_ID" ""
  rec "$HTTP_CODE" "DELETE Class $CLASS_ID"
fi

echo
echo "==== Summary ===="
echo "Passed: ${#PASS[@]}"
for p in "${PASS[@]}"; do echo "  - $p"; done
echo "Failed: ${#FAIL[@]}"
for f in "${FAIL[@]}"; do echo "  - $f"; done

# Exit non-zero if any failures
if [[ ${#FAIL[@]} -gt 0 ]]; then exit 1; fi


