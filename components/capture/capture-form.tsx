'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Public capture form shown on a portfolio project page (the NFC landing page).
 * On success the server returns a pre-filled wa.me link and we send the visitor
 * straight into WhatsApp.
 */
const ZCaptureForm = z.object({
  name: z.string().min(1, 'Please enter your name').max(200),
  anchorType: z.enum(['linkedin', 'company']),
  anchorValue: z.string().min(1, 'Add a LinkedIn URL or company').max(500),
  message: z.string().max(1000).optional(),
  // Honeypot — must stay empty; bots tend to fill every field.
  website: z.string().max(0).optional(),
});

type CaptureFormValues = z.infer<typeof ZCaptureForm>;

export function CaptureForm({ campaignId }: { campaignId?: string }) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CaptureFormValues>({
    resolver: zodResolver(ZCaptureForm),
    defaultValues: { anchorType: 'linkedin' },
  });

  const anchorType = watch('anchorType');

  const onSubmit = async (values: CaptureFormValues) => {
    setServerError(null);
    try {
      const res = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, campaignId }),
      });

      if (res.status === 429) {
        setServerError('Too many submissions right now. Please try again later.');
        return;
      }
      if (!res.ok) {
        setServerError('Something went wrong. Please try again.');
        return;
      }

      const data = (await res.json()) as { waUrl?: string };
      if (data.waUrl) {
        // Hand off to WhatsApp with the pre-filled message.
        window.location.href = data.waUrl;
      }
    } catch {
      setServerError('Network error. Please try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 flex flex-col gap-4 rounded-xl border border-gray-200 p-6"
      noValidate
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Let&apos;s stay in touch</h3>
        <p className="mt-1 text-sm text-gray-600">
          Leave your name and I&apos;ll pick it up on WhatsApp.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium text-gray-700">
          Name
        </label>
        <Input id="name" placeholder="Ada Lovelace" {...register('name')} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">How can I find you?</span>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" value="linkedin" {...register('anchorType')} />
            LinkedIn URL
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" value="company" {...register('anchorType')} />
            Company
          </label>
        </div>
        <Input
          id="anchorValue"
          placeholder={
            anchorType === 'company'
              ? 'Acme Inc.'
              : 'https://www.linkedin.com/in/your-handle'
          }
          {...register('anchorValue')}
        />
        {errors.anchorValue && (
          <p className="text-sm text-red-600">{errors.anchorValue.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="message" className="text-sm font-medium text-gray-700">
          Note (optional)
        </label>
        <textarea
          id="message"
          rows={2}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          placeholder="We met at…"
          {...register('message')}
        />
      </div>

      {/* Honeypot: visually hidden, off-screen, not announced to AT. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register('website')}
      />

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Sending…' : 'Open WhatsApp'}
      </Button>
    </form>
  );
}
