import { useState, type FormEvent } from 'react';
import { Button } from '../../components/common/Button';
import { SelectField, TextAreaField, TextField } from '../../components/common/FormField';
import { SUPPORT_SUBJECTS } from '../../data/support';
import { useToast } from '../../hooks/useToast';
import { validateContact, type ContactErrors } from '../../utils/validation';
import { api } from '../../services/api';

/** Sends a validated support request to the backend and reports the saved ticket result. */
export function ContactForm() {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState(SUPPORT_SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateContact(name, email, message);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSubmitting(true);
    try {
      await api.post('/support/contact', { name: name.trim(), email: email.trim(), orderNumber: orderNumber.trim(), subject, message: message.trim() });
      showToast('Support request received. Our team can review it from the support ticket store.');
      setName(''); setEmail(''); setOrderNumber(''); setSubject(SUPPORT_SUBJECTS[0]); setMessage('');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Could not send your message. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
      <TextField label="Full Name" type="text" autoComplete="name" placeholder="Enter your name" maxLength={100} value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
      <TextField label="Email Address" type="email" autoComplete="email" placeholder="Enter your email" maxLength={254} value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Order Number (Optional)" type="text" placeholder="Enter your order number" maxLength={80} value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
      <SelectField label="Select Subject" options={SUPPORT_SUBJECTS} value={subject} onChange={(e) => setSubject(e.target.value)} />
      <TextAreaField label="Your Message" rows={4} maxLength={2000} placeholder="Tell us how we can help..." value={message} error={errors.message} onChange={(e) => setMessage(e.target.value)} />
      <Button type="submit" size="lg" arrow className="w-full" disabled={submitting}>{submitting ? 'Sending…' : 'Send Message'}</Button>
    </form>
  );
}
