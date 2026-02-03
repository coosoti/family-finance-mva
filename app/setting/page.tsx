import { redirect } from 'next/navigation';

export default function SettingRedirectPage() {
  // Keep singular `/setting` route available and redirect to primary `/settings` page
  redirect('/settings');
}
