import { useState } from 'react';

import * as Form from '@radix-ui/react-form';

import { Button } from './ui/button';

interface UserRegistrationFormProps {
  onSubmit: (data: { whatsappName: string; sheetUrl: string }) => Promise<void>;
}

export function UserRegistrationForm({ onSubmit }: UserRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const whatsappName = formData.get('whatsappName') as string;
    const sheetUrl = formData.get('sheetUrl') as string;

    try {
      await onSubmit({ whatsappName, sheetUrl });
    } catch (error) {
      console.error('Error registering user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form.Root className="space-y-6" onSubmit={handleSubmit}>
      <Form.Field name="whatsappName">
        <div className="flex items-baseline justify-between">
          <Form.Label className="text-sm font-medium">WhatsApp Name</Form.Label>
          <Form.Message className="text-sm text-red-500" match="valueMissing">
            Please enter your WhatsApp name
          </Form.Message>
        </div>
        <Form.Control asChild>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            type="text"
            required
            placeholder="Enter your WhatsApp name"
          />
        </Form.Control>
      </Form.Field>

      <Form.Field name="sheetUrl">
        <div className="flex items-baseline justify-between">
          <Form.Label className="text-sm font-medium">Google Sheet URL</Form.Label>
          <Form.Message className="text-sm text-red-500" match="valueMissing">
            Please enter your Google Sheet URL
          </Form.Message>
        </div>
        <Form.Control asChild>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            type="url"
            required
            placeholder="Enter your Google Sheet URL"
          />
        </Form.Control>
      </Form.Field>

      <Form.Submit asChild>
        <Button className="w-full" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </Form.Submit>
    </Form.Root>
  );
} 