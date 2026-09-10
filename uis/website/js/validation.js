// Calendar-only calculations use UTC to avoid daylight-saving time shifts.
const enquiryValidation = (() => {
  const messages = {
    first_name: "First name must contain only letters and be at least 2 characters",
    last_name: "Last name must contain only letters and be at least 2 characters",
    date_of_birth: "Enter a valid date of birth. Patient must be between 0 and 120 years old",
    email: "Enter a valid email address (example: name@provider.com)",
    phone: "Phone must include a country code (example: +1 305 555 0191)",
    preferred_language: "Select your preferred language",
    preferred_clinic: "Select the clinic you would like to visit",
    preferred_date: "Select a date at least 1 business day from today and no more than 60 days ahead",
    preferred_time: "Select your preferred time of day",
    service_type: "Select the type of care you are looking for",
    paediatric: "Paediatric Care is available for patients under 18. Please check the date of birth or select a different service.",
    new_patient: "Please indicate whether this is your first visit to HealthCore",
    has_insurance: "Please indicate whether you have health insurance",
    insurance_provider: "Please enter your insurance provider name",
    insurance_member_id: "Member ID must be between 6 and 20 alphanumeric characters",
    patient_id: "Patient ID must be HC- followed by 6 alphanumeric characters (example: HC-A3F291)",
    contact_consent: "You must consent to being contacted before submitting this form",
  };
  // Closing hours from the Locations page: Monday–Friday and Saturday.
  const clinics = {
    "HealthCore Austin Central": [20, 15],
    "HealthCore Austin North": [19, 0],
    "HealthCore San Antonio": [18, 13],
    "HealthCore Miami": [20, 16],
    "HealthCore Orlando": [18, 0],
    "HealthCore Atlanta": [19, 0],
  };
  const services = ["Primary Care", "Chronic Disease Management", "Specialist Consultation", "Preventive Health", "Women's Health", "Paediatric Care", "Mental Health"];

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
  }
  function dateString(date) { return date.toISOString().slice(0, 10); }
  function todayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
  function dateBounds(today = todayString()) {
    const minimum = parseDate(today);
    do { minimum.setUTCDate(minimum.getUTCDate() + 1); } while ([0, 6].includes(minimum.getUTCDay()));
    const maximum = parseDate(today);
    maximum.setUTCDate(maximum.getUTCDate() + 60);
    return { minimum: dateString(minimum), maximum: dateString(maximum), today };
  }
  function ageOn(birth, today) {
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    if (today.getUTCMonth() < birth.getUTCMonth() || (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())) age--;
    return age;
  }

  // Each field validator returns its error message, or null when valid.
  function validateName(value, fieldName) {
    const pattern = /^\p{L}{2,50}$/u;
    if (!pattern.test(value.normalize("NFC"))) return messages[fieldName];
    return null;
  }

  function validateDateOfBirth(value, today = todayString()) {
    const birth = parseDate(value.trim());
    const current = parseDate(today);
    if (!birth || birth > current || ageOn(birth, current) > 120) return messages.date_of_birth;
    return null;
  }

  function validateEmail(value) {
    if (!value.trim()) return messages.email;
    const pattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
    if (!pattern.test(value.trim())) return messages.email;
    return null;
  }

  function validatePhone(value) {
    const phone = value.trim();
    const pattern = /^\+[1-9]\d*(?:[ -]\d+)*$/;
    const digits = phone.replace(/\D/g, "");
    if (!pattern.test(phone) || digits.length < 7 || digits.length > 15) return messages.phone;
    return null;
  }

  function validateSelection(value, options, message) {
    if (!options.includes(value.trim())) return message;
    return null;
  }

  function validatePreferredDate(value, today = todayString()) {
    const date = value.trim();
    const bounds = dateBounds(today);
    if (!parseDate(date) || date < bounds.minimum || date > bounds.maximum) return messages.preferred_date;
    return null;
  }

  function validateServiceType(value, dateOfBirth, today = todayString()) {
    const selectionError = validateSelection(value, services, messages.service_type);
    if (selectionError) return selectionError;
    if (value.trim() === "Paediatric Care" && !validateDateOfBirth(dateOfBirth, today)) {
      if (ageOn(parseDate(dateOfBirth.trim()), parseDate(today)) >= 18) return messages.paediatric;
    }
    return null;
  }

  function validateInsuranceProvider(value, hasInsurance) {
    if (hasInsurance.trim() !== "Yes") return null;
    if (!value.trim() || value.trim().length > 100) return messages.insurance_provider;
    return null;
  }

  function validateInsuranceMemberId(value, hasInsurance) {
    if (hasInsurance.trim() !== "Yes") return null;
    const pattern = /^[a-zA-Z0-9]{6,20}$/;
    if (!pattern.test(value.trim())) return messages.insurance_member_id;
    return null;
  }

  function validatePatientId(value, newPatient) {
    if (newPatient.trim() !== "No" || !value.trim()) return null;
    const pattern = /^HC-[A-Za-z0-9]{6}$/;
    if (!pattern.test(value.trim())) return messages.patient_id;
    return null;
  }

  function validateHealthConcern(value) {
    const length = value.trim().length;
    if (length < 20) return `Please describe your health concern in at least 20 characters (${20 - length} characters remaining)`;
    if (value.length > 500) return "Please describe your health concern in no more than 500 characters";
    return null;
  }

  function validateConsent(value) {
    if (value !== "Yes") return messages.contact_consent;
    return null;
  }

  function eveningAvailability(time, clinic, date, today) {
    if (time.trim() !== "Evening" || !Object.hasOwn(clinics, clinic.trim())) return null;
    const day = validatePreferredDate(date, today) ? null : parseDate(date.trim()).getUTCDay();
    const closing = day === 0 ? 0 : day === 6 ? clinics[clinic.trim()][1] : clinics[clinic.trim()][0];
    return { closing, day };
  }

  function validatePreferredTime(value, clinic, date, today = todayString()) {
    const selectionError = validateSelection(value, ["Morning", "Afternoon", "Evening"], messages.preferred_time);
    if (selectionError) return selectionError;
    const availability = eveningAvailability(value, clinic, date, today);
    if (availability && availability.closing <= 17) return `${clinic.trim()} is not open past 5pm on the selected date. Please choose another time, date, or clinic.`;
    return null;
  }

  function getEveningWarning(value, clinic, date, today = todayString()) {
    const availability = eveningAvailability(value, clinic, date, today);
    if (!availability || availability.closing <= 17 || availability.closing >= 20) return null;
    return `${clinic.trim()} closes at ${availability.closing - 12}pm${availability.day === null ? " on weekdays" : " on the selected date"}. Evening availability is limited; our front desk will confirm a suitable time.`;
  }

  function validate(data, today = todayString()) {
    const value = (name) => String(data[name] ?? "");
    const results = {
      first_name: validateName(value("first_name"), "first_name"),
      last_name: validateName(value("last_name"), "last_name"),
      date_of_birth: validateDateOfBirth(value("date_of_birth"), today),
      email: validateEmail(value("email")),
      phone: validatePhone(value("phone")),
      preferred_language: validateSelection(value("preferred_language"), ["English", "Spanish"], messages.preferred_language),
      preferred_clinic: validateSelection(value("preferred_clinic"), Object.keys(clinics), messages.preferred_clinic),
      preferred_date: validatePreferredDate(value("preferred_date"), today),
      preferred_time: validatePreferredTime(value("preferred_time"), value("preferred_clinic"), value("preferred_date"), today),
      service_type: validateServiceType(value("service_type"), value("date_of_birth"), today),
      new_patient: validateSelection(value("new_patient"), ["Yes", "No"], messages.new_patient),
      has_insurance: validateSelection(value("has_insurance"), ["Yes", "No"], messages.has_insurance),
      insurance_provider: validateInsuranceProvider(value("insurance_provider"), value("has_insurance")),
      insurance_member_id: validateInsuranceMemberId(value("insurance_member_id"), value("has_insurance")),
      patient_id: validatePatientId(value("patient_id"), value("new_patient")),
      health_concern: validateHealthConcern(value("health_concern")),
      contact_consent: validateConsent(value("contact_consent")),
    };
    const errors = Object.fromEntries(Object.entries(results).filter(([, message]) => message !== null));
    const eveningWarning = getEveningWarning(value("preferred_time"), value("preferred_clinic"), value("preferred_date"), today);
    return { errors, warnings: eveningWarning ? { preferred_time: eveningWarning } : {} };
  }

  // Field names also cover radio groups, where multiple inputs share one error.
  function showFieldError(fieldName, message) {
    const inputs = document.querySelectorAll(`#patient-enquiry [name="${fieldName}"]`);
    const errorEl = document.getElementById(`${fieldName}-error`);
    inputs.forEach((input) => {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    });
    errorEl.textContent = message || "";
    errorEl.hidden = !message;
  }

  return { validate, showFieldError, dateBounds, todayString, messages };
})();

if (typeof module !== "undefined" && module.exports) module.exports = enquiryValidation;
