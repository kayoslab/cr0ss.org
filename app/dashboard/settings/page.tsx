import 'server-only';

import React from 'react';
import SettingsClient from './settings.client';
import { getCoffeeConfig } from '@/lib/dashboard/settings';

export default async function SettingsPage() {
  const { items } = await getCoffeeConfig(1, 20);
  return <SettingsClient coffees={items} />;
}
