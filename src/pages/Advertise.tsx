import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createAdRequest, type AdRequestResponse } from '../api/ads';

const WHATSAPP_NUMBER = '+94775802625';

const readFileAsDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
  reader.readAsDataURL(file);
});

interface AdFormState {
  companyName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  adTitle: string;
  adDescription: string;
  adType: string;
  adGoal: string;
  mediaUrl: string;
  mediaNotes: string;
  cta: string;
  viewsPerDay: string;
  minutesPerDay: string;
  startDate: string;
  endDate: string;
}

const initialForm: AdFormState = {
  companyName: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  adTitle: '',
  adDescription: '',
  adType: 'Image',
  adGoal: '',
  mediaUrl: '',
  mediaNotes: '',
  cta: '',
  viewsPerDay: '',
  minutesPerDay: '',
  startDate: '',
  endDate: ''
};

const buildMessage = (form: AdFormState, requestId?: string, mediaFileName?: string | null) => {
  const lines = [
    'New paid advertisement request',
    requestId ? `Request ID: ${requestId}` : null,
    `Company: ${form.companyName}`,
    `Contact person: ${form.contactPerson}`,
    `Contact email: ${form.contactEmail}`,
    `Contact phone: ${form.contactPhone}`,
    `Ad title: ${form.adTitle}`,
    `Ad description: ${form.adDescription}`,
    `Ad type: ${form.adType}`,
    `Ad goal: ${form.adGoal}`,
    form.mediaUrl ? `Media URL: ${form.mediaUrl}` : 'Media URL: (will share separately)',
    mediaFileName ? `Media file uploaded: ${mediaFileName}` : null,
    form.mediaNotes ? `Media notes: ${form.mediaNotes}` : null,
    form.cta ? `CTA: ${form.cta}` : null,
    form.viewsPerDay ? `Views per day: ${form.viewsPerDay}` : null,
    form.minutesPerDay ? `Minutes per day: ${form.minutesPerDay}` : null,
    form.startDate ? `Start date: ${form.startDate}` : null,
    form.endDate ? `End date: ${form.endDate}` : null,
    'Payment: Please share payment options and package pricing.'
  ].filter(Boolean) as string[];

  return lines.join('\n');
};

export default function Advertise() {
  const { user } = useAuth();
  const [form, setForm] = useState<AdFormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<AdRequestResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedForm, setSubmittedForm] = useState<AdFormState | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submittedMediaFileName, setSubmittedMediaFileName] = useState<string | null>(null);

  const canAdvertise = user?.role === 'COMPANY' || user?.role === 'ADMIN';

  const hasVisibilityTargets = useMemo(() => {
    return Boolean(form.viewsPerDay.trim() || form.minutesPerDay.trim());
  }, [form.viewsPerDay, form.minutesPerDay]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setRequestInfo(null);

    if (!canAdvertise) {
      setError('Only company accounts can submit advertisements.');
      return;
    }

    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.contactEmail.trim()) {
      setError('Company name, contact person, and contact email are required.');
      return;
    }

    if (!form.adTitle.trim() || !form.adDescription.trim()) {
      setError('Ad title and description are required.');
      return;
    }

    if (!hasVisibilityTargets) {
      setError('Provide views per day or minutes per day for visibility.');
      return;
    }

    if (!form.startDate.trim() || !form.endDate.trim()) {
      setError('Start date and end date are required.');
      return;
    }

    setSubmitting(true);
    const viewsPerDay = form.viewsPerDay.trim() ? Number(form.viewsPerDay) : undefined;
    const minutesPerDay = form.minutesPerDay.trim() ? Number(form.minutesPerDay) : undefined;

    try {
      const mediaContent = mediaFile ? await readFileAsDataUrl(mediaFile) : undefined;
      const payload = {
        companyName: form.companyName.trim(),
        contactPerson: form.contactPerson.trim(),
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim() || undefined,
        adTitle: form.adTitle.trim(),
        adDescription: form.adDescription.trim(),
        adType: form.adType,
        adGoal: form.adGoal.trim() || undefined,
        mediaUrl: form.mediaUrl.trim() || undefined,
        mediaContent,
        mediaNotes: form.mediaNotes.trim() || undefined,
        cta: form.cta.trim() || undefined,
        viewsPerDay: Number.isFinite(viewsPerDay) ? viewsPerDay : undefined,
        minutesPerDay: Number.isFinite(minutesPerDay) ? minutesPerDay : undefined,
        startDate: form.startDate,
        endDate: form.endDate
      };

      const response = await createAdRequest(payload);
      setSubmittedForm(form);
      setSubmittedMediaFileName(mediaFile?.name ?? null);
      setRequestInfo(response);
      setSuccess('Ad request submitted. An agent will confirm pricing and payment via WhatsApp.');
      setForm(initialForm);
      setMediaFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit ad request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="panel">
          <h2>Advertise with us</h2>
          <p>Login is required to submit paid advertisements.</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link className="button" to="/login">Login</Link>
            <Link className="button button--ghost" to="/">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!canAdvertise) {
    return (
      <div className="container">
        <div className="panel">
          <h2>Advertise with us</h2>
          <p>Only company accounts can submit paid advertisements.</p>
          <Link className="button button--ghost" to="/jobs">Back to Jobs</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="jobs-header">
        <div>
          <h2>Paid Advertisements</h2>
          <p>Submit ad details and an agent will confirm packages and payment via WhatsApp.</p>
        </div>
        <div className="jobs-summary">WhatsApp agent: +94 77 000 0000</div>
      </div>

      <form className="panel jobs-search" onSubmit={handleSubmit}>
        {error && <div className="notice notice--error">{error}</div>}
        {success && <div className="notice">{success}</div>}
        <div className="jobs-search__fields">
          <div className="field">
            <label htmlFor="adCompany">Company name</label>
            <input
              id="adCompany"
              value={form.companyName}
              onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adContact">Contact person</label>
            <input
              id="adContact"
              value={form.contactPerson}
              onChange={(event) => setForm((prev) => ({ ...prev, contactPerson: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adEmail">Contact email</label>
            <input
              id="adEmail"
              type="email"
              value={form.contactEmail}
              onChange={(event) => setForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adPhone">Contact phone</label>
            <input
              id="adPhone"
              value={form.contactPhone}
              onChange={(event) => setForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
              placeholder="+94 7X XXX XXXX"
            />
          </div>
          <div className="field">
            <label htmlFor="adTitle">Ad title</label>
            <input
              id="adTitle"
              value={form.adTitle}
              onChange={(event) => setForm((prev) => ({ ...prev, adTitle: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adDescription">Ad description</label>
            <textarea
              id="adDescription"
              rows={3}
              value={form.adDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, adDescription: event.target.value }))}
              placeholder="Short summary shown to job seekers"
            />
          </div>
          <div className="field">
            <label htmlFor="adType">Ad type</label>
            <select
              id="adType"
              value={form.adType}
              onChange={(event) => setForm((prev) => ({ ...prev, adType: event.target.value }))}
            >
              <option value="Image">Image</option>
              <option value="GIF">GIF</option>
              <option value="Video">Video</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="adGoal">Campaign goal</label>
            <input
              id="adGoal"
              value={form.adGoal}
              onChange={(event) => setForm((prev) => ({ ...prev, adGoal: event.target.value }))}
              placeholder="Drive applications, brand awareness, event signup"
            />
          </div>
          <div className="field">
            <label htmlFor="adCta">Call to action</label>
            <input
              id="adCta"
              value={form.cta}
              onChange={(event) => setForm((prev) => ({ ...prev, cta: event.target.value }))}
              placeholder="Apply now, Learn more"
            />
          </div>
          <div className="field">
            <label htmlFor="adMediaUrl">Media URL (optional)</label>
            <input
              id="adMediaUrl"
              value={form.mediaUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, mediaUrl: event.target.value }))}
              placeholder="Link to image/GIF/video"
            />
          </div>
          <div className="field">
            <label htmlFor="adMediaFile">Upload media (image/GIF/video)</label>
            <input
              id="adMediaFile"
              type="file"
              accept="image/*,video/*"
              onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)}
            />
          </div>
          <div className="field">
            <label htmlFor="adMediaNotes">Media notes</label>
            <textarea
              id="adMediaNotes"
              rows={3}
              value={form.mediaNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, mediaNotes: event.target.value }))}
              placeholder="File size, format, or design requests"
            />
          </div>
          <div className="field">
            <label htmlFor="adViews">Views per day</label>
            <input
              id="adViews"
              type="number"
              min="0"
              step="1"
              value={form.viewsPerDay}
              onChange={(event) => setForm((prev) => ({ ...prev, viewsPerDay: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adMinutes">Minutes per day</label>
            <input
              id="adMinutes"
              type="number"
              min="0"
              step="1"
              value={form.minutesPerDay}
              onChange={(event) => setForm((prev) => ({ ...prev, minutesPerDay: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adStart">Start date</label>
            <input
              id="adStart"
              type="date"
              value={form.startDate}
              onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="adEnd">End date</label>
            <input
              id="adEnd"
              type="date"
              value={form.endDate}
              onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
            />
          </div>
        </div>
        <div className="jobs-search__actions">
          <button className="button" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit ad request'}
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() => {
              setForm(initialForm);
              setMediaFile(null);
              setSubmittedForm(null);
              setSubmittedMediaFileName(null);
            }}
          >
            Reset
          </button>
        </div>
        {requestInfo && (
          <div className="notice">
            Request ID: {requestInfo.id}. Use the button below to coordinate payment on WhatsApp.
          </div>
        )}
        <div className="jobs-search__actions">
          <a
            className="button button--ghost"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildMessage(submittedForm ?? form, requestInfo?.id, submittedMediaFileName))}`}
            target="_blank"
            rel="noreferrer"
          >
            Contact via WhatsApp
          </a>
        </div>
        <p className="notice">
          An agent will confirm pricing, packages, and payment on WhatsApp. You can also attach media directly in the chat.
        </p>
      </form>
    </div>
  );
}
