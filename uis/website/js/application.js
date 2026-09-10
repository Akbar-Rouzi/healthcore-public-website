const enquiryForm = document.getElementById("patient-enquiry");
const insuranceDetails = document.getElementById("insurance-details");
const returningDetails = document.getElementById("returning-patient-details");
const healthConcern = document.getElementById("health-concern");
const concernCount = document.getElementById("concern-count");
const summary = document.getElementById("validation-summary");
const submissionStatus = document.getElementById("submission-status");
document.getElementById("close-confirmation").addEventListener("click", () => submissionStatus.close());
submissionStatus.addEventListener("close", () => {
  enquiryForm.reset();
  touched.clear();
  submitted = false;
  updateConditionalFields();
  updateDateBounds();
  renderValidation();
  enquiryForm.elements.first_name.focus();
});
const touched = new Set();
let submitted = false;
const fieldNames = [...new Set([...enquiryForm.elements].map((field) => field.name).filter(Boolean))];
const controls = (name) => [...enquiryForm.querySelectorAll(`[name="${name}"]`)];
const errorNodes = new Map();

// Keep the original help text and link each control to its inline error.
for (const name of fieldNames) {
  const fields = controls(name);
  const first = fields[0];
  const error = document.createElement("p");
  error.id = `${name}-error`;
  error.className = "mt-2 text-xs leading-5 text-red-700 [&[hidden]]:hidden";
  error.hidden = true;
  const anchor = first.type === "radio" ? first.closest('[role="radiogroup"]') : first.type === "checkbox" ? first.closest("label") : first;
  anchor.insertAdjacentElement("afterend", error);
  errorNodes.set(name, error);
  fields.forEach((field) => {
    field.setAttribute("aria-describedby", `${field.getAttribute("aria-describedby") || ""} ${error.id}`.trim());
    field.classList.add("aria-[invalid=true]:border-red-600", "aria-[invalid=true]:outline-red-600", "scroll-mt-28");
    if (field.getAttribute("aria-required") === "true" || field.type === "radio") field.required = true;
  });
}
const warning = document.createElement("p");
warning.id = "preferred-time-warning";
warning.className = "mt-2 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-amber-900 [&[hidden]]:hidden";
warning.setAttribute("role", "status");
warning.hidden = true;
errorNodes.get("preferred_time").insertAdjacentElement("afterend", warning);
controls("preferred_time").forEach((field) => field.setAttribute("aria-describedby", `preferred_time-error ${warning.id}`));

function updateConditionalFields() {
  const insured = enquiryForm.elements.has_insurance.value === "Yes";
  insuranceDetails.hidden = !insured;
  insuranceDetails.querySelectorAll("input").forEach((input) => {
    input.disabled = !insured;
    input.required = insured;
    input.setAttribute("aria-required", String(insured));
  });
  const returning = enquiryForm.elements.new_patient.value === "No";
  returningDetails.hidden = !returning;
  enquiryForm.elements.patient_id.disabled = !returning;
}

function updateDateBounds() {
  const bounds = enquiryValidation.dateBounds();
  enquiryForm.elements.date_of_birth.max = bounds.today;
  enquiryForm.elements.preferred_date.min = bounds.minimum;
  enquiryForm.elements.preferred_date.max = bounds.maximum;
}

function renderValidation() {
  const result = enquiryValidation.validate(Object.fromEntries(new FormData(enquiryForm)));
  for (const name of fieldNames) {
    const message = submitted || touched.has(name) ? result.errors[name] : "";
    enquiryValidation.showFieldError(name, message);
  }
  warning.textContent = result.warnings.preferred_time || "";
  warning.hidden = !warning.textContent;
  const count = Object.keys(result.errors).length;
  summary.hidden = !submitted || count === 0;
  summary.textContent = submitted && count ? `Please correct ${count} ${count === 1 ? "field" : "fields"} below before submitting your enquiry.` : "";
  concernCount.textContent = healthConcern.value.length;
  document.getElementById("concern-counter").classList.toggle("text-red-700", healthConcern.value.length > 500);
  return result;
}

function handleEdit(event) {
  if (!event.target.name) return;
  touched.add(event.target.name);
  submissionStatus.close();
  updateConditionalFields();
  // Show dependent errors as soon as a complete combination is selected.
  if (["service_type", "date_of_birth"].includes(event.target.name) && enquiryForm.elements.service_type.value && enquiryForm.elements.date_of_birth.value) touched.add("service_type");
  if (["preferred_time", "preferred_date", "preferred_clinic"].includes(event.target.name) && enquiryForm.elements.preferred_time.value) touched.add("preferred_time");
  renderValidation();
}
enquiryForm.addEventListener("input", handleEdit);
enquiryForm.addEventListener("change", (event) => {
  handleEdit(event);
});
enquiryForm.addEventListener("focusout", (event) => {
  if (!event.target.name) return;
  touched.add(event.target.name);
  renderValidation();
});

// Match the clinic links already used by the Locations page.
const requestedClinic = new URLSearchParams(window.location.search).get("clinic");
const clinicSelect = enquiryForm.elements.preferred_clinic;
const matchingClinic = Array.from(clinicSelect.options).find(
  (option) => option.value && (option.value === requestedClinic || option.value === `HealthCore ${requestedClinic}`),
);
if (matchingClinic) clinicSelect.value = matchingClinic.value;

function collectValidationErrors() {
  submitted = true;
  submissionStatus.close();
  updateDateBounds();
  updateConditionalFields();
  const { errors } = renderValidation();
  const invalidFields = fieldNames.filter((name) => errors[name]);
  if (invalidFields.length > 0) controls(invalidFields[0])[0].focus();
  return invalidFields.map((name) => ({ name, message: errors[name] }));
}

function showSuccessMessage() {
  submissionStatus.showModal();
}

enquiryForm.addEventListener("submit", (event) => {
  // Simulate submission locally; never transmit or store patient details.
  event.preventDefault();
  const errors = collectValidationErrors();
  if (errors.length > 0) return;
  showSuccessMessage();
});
window.addEventListener("focus", updateDateBounds);
updateDateBounds();
updateConditionalFields();
renderValidation();
