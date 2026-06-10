const form = document.getElementById('waitlistForm')
const statusEl = document.getElementById('formStatus')
const submitBtn = document.getElementById('submitBtn')

// Set this from hosting if you want to POST submissions to a backend endpoint.
const WAITLIST_ENDPOINT = window.WAITLIST_ENDPOINT || ''

function setStatus(message, type = '') {
  statusEl.textContent = message
  statusEl.className = `form-status${type ? ` ${type}` : ''}`
}

function serializeForm(formEl) {
  const formData = new FormData(formEl)
  return {
    fullName: String(formData.get('fullName') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    businessName: String(formData.get('businessName') || '').trim(),
    businessType: String(formData.get('businessType') || '').trim(),
    teamSize: String(formData.get('teamSize') || '').trim(),
    notes: String(formData.get('notes') || '').trim(),
    consent: formData.get('consent') === 'on',
    createdAt: new Date().toISOString(),
  }
}

function validate(payload) {
  if (!payload.fullName || !payload.email || !payload.businessName) {
    return 'Please complete all required fields.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'Please provide a valid email address.'
  }

  if (!payload.consent) {
    return 'You must agree to receive beta updates.'
  }

  return ''
}

async function submitRemote(payload) {
  const res = await fetch(WAITLIST_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error('Remote waitlist endpoint returned an error.')
  }
}

function saveLocal(payload) {
  const key = 'kapita_waitlist_entries'
  const existing = JSON.parse(localStorage.getItem(key) || '[]')
  existing.push(payload)
  localStorage.setItem(key, JSON.stringify(existing))
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  const payload = serializeForm(form)

  const problem = validate(payload)
  if (problem) {
    setStatus(problem, 'error')
    return
  }

  submitBtn.disabled = true
  setStatus('Submitting your request...')

  try {
    if (WAITLIST_ENDPOINT) {
      await submitRemote(payload)
    } else {
      saveLocal(payload)
    }

    form.reset()
    setStatus('Success. You are on the waitlist. We will contact you soon.', 'success')
  } catch (error) {
    setStatus('Could not submit right now. Please try again in a moment.', 'error')
  } finally {
    submitBtn.disabled = false
  }
})
