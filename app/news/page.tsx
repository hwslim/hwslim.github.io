import { ContentPage } from '../../components/content-page';
import { getSettings } from '../../lib/content.mjs';

export const metadata = { title: getSettings()['news_title'] };
export default function Page() { return <ContentPage page="news" />; }
