import { ContentPage } from '../../components/content-page';
import { getSettings } from '../../lib/content.mjs';

export const metadata = { title: getSettings()['gallery_title'] };
export default function Page() { return <ContentPage page="gallery" />; }
