import { getTranslationWithFallback } from "../language/translation-utils.js";

// Calendar-only calculations use UTC to avoid daylight-saving time shifts.
export const enquiryValidation = (() => {

  // Resolve validation text in the current page language when validation runs.
  function message(key, values = {}) {
    const language = typeof document === "undefined" ? "en" : document.documentElement.lang;
    return getTranslationWithFallback(`application.validation.${key}`, language)
      .replace(/\{(\w+)\}/g, (token, name) => values[name] ?? token);
  }

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
    if (!pattern.test(value.normalize("NFC"))) return message(fieldName);
    return null;
  }

  function validateDateOfBirth(value, today = todayString()) {
    const birth = parseDate(value.trim());
    const current = parseDate(today);
    if (!birth || birth > current || ageOn(birth, current) > 120) return message("date_of_birth");
    return null;
  }

  function validateEmail(value) {
    if (!value.trim()) return message("email");
    const pattern = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;
    if (!pattern.test(value.trim())) return message("email");
    return null;
  }

  function validatePhone(value) {
    const phone = value.trim();
    const pattern = /^\+[1-9]\d*(?:[ -]\d+)*$/;
    const digits = phone.replace(/\D/g, "");
    if (!pattern.test(phone) || digits.length < 7 || digits.length > 15) return message("phone");
    return null;
  }

  function validateSelection(value, options, message) {
    if (!options.includes(value.trim())) return message;
    return null;
  }

  function validatePreferredDate(value, today = todayString()) {
    const date = value.trim();
    const bounds = dateBounds(today);
    if (!parseDate(date) || date < bounds.minimum || date > bounds.maximum) return message("preferred_date");
    return null;
  }

  function validateServiceType(value, dateOfBirth, today = todayString()) {
    const selectionError = validateSelection(value, services, message("service_type"));
    if (selectionError) return selectionError;
    if (value.trim() === "Paediatric Care" && !validateDateOfBirth(dateOfBirth, today)) {
      if (ageOn(parseDate(dateOfBirth.trim()), parseDate(today)) >= 18) return message("paediatric");
    }
    return null;
  }

  function validateInsuranceProvider(value, hasInsurance) {
    if (hasInsurance.trim() !== "Yes") return null;
    if (!value.trim() || value.trim().length > 100) return message("insurance_provider");
    return null;
  }

  function validateInsuranceMemberId(value, hasInsurance) {
    if (hasInsurance.trim() !== "Yes") return null;
    const pattern = /^[a-zA-Z0-9]{6,20}$/;
    if (!pattern.test(value.trim())) return message("insurance_member_id");
    return null;
  }

  function validatePatientId(value, newPatient) {
    if (newPatient.trim() !== "No" || !value.trim()) return null;
    const pattern = /^HC-[A-Za-z0-9]{6}$/;
    if (!pattern.test(value.trim())) return message("patient_id");
    return null;
  }

  function validateHealthConcern(value) {
    const length = value.trim().length;
    if (length < 20) return message("concernShort", { remaining: 20 - length });
    if (value.length > 500) return message("concernLong");
    return null;
  }

  function validateConsent(value) {
    if (value !== "Yes") return message("contact_consent");
    return null;
  }

  function eveningAvailability(time, clinic, date, today) {
    if (time.trim() !== "Evening" || !Object.hasOwn(clinics, clinic.trim())) return null;
    const day = validatePreferredDate(date, today) ? null : parseDate(date.trim()).getUTCDay();
    const closing = day === 0 ? 0 : day === 6 ? clinics[clinic.trim()][1] : clinics[clinic.trim()][0];
    return { closing, day };
  }

  function validatePreferredTime(value, clinic, date, today = todayString()) {
    const selectionError = validateSelection(value, ["Morning", "Afternoon", "Evening"], message("preferred_time"));
    if (selectionError) return selectionError;
    const availability = eveningAvailability(value, clinic, date, today);
    if (availability && availability.closing <= 17) return message("eveningClosed", { clinic: clinic.trim() });
    return null;
  }

  function getEveningWarning(value, clinic, date, today = todayString()) {
    const availability = eveningAvailability(value, clinic, date, today);
    if (!availability || availability.closing <= 17 || availability.closing >= 20) return null;
    return message(availability.day === null ? "eveningWeekdays" : "eveningDate", { clinic: clinic.trim(), hour: availability.closing - 12, hour24: availability.closing });
  }

  function validate(data, today = todayString()) {
    const value = (name) => String(data[name] ?? "");
    const results = {
      first_name: validateName(value("first_name"), "first_name"),
      last_name: validateName(value("last_name"), "last_name"),
      date_of_birth: validateDateOfBirth(value("date_of_birth"), today),
      email: validateEmail(value("email")),
      phone: validatePhone(value("phone")),
      preferred_language: validateSelection(value("preferred_language"), ["English", "Spanish"], message("preferred_language")),
      preferred_clinic: validateSelection(value("preferred_clinic"), Object.keys(clinics), message("preferred_clinic")),
      preferred_date: validatePreferredDate(value("preferred_date"), today),
      preferred_time: validatePreferredTime(value("preferred_time"), value("preferred_clinic"), value("preferred_date"), today),
      service_type: validateServiceType(value("service_type"), value("date_of_birth"), today),
      new_patient: validateSelection(value("new_patient"), ["Yes", "No"], message("new_patient")),
      has_insurance: validateSelection(value("has_insurance"), ["Yes", "No"], message("has_insurance")),
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

  return { validate, showFieldError, dateBounds, todayString };
})();
