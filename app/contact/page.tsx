import { ContentPage } from '../../components/content-page';
import { getSettings } from '../../lib/content.mjs';

export const metadata = { title: getSettings()['contact_title'] };
export default function Page() { return <ContentPage page="contact" />; }
