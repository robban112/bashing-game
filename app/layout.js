import './globals.css';

export const metadata = {
  title: 'Svarta riddaren · Bashing Game',
  description: 'Ett medeltida arkadspel: samla kungens skatt, undvik trollkarlar och rusta din riddare för nästa dag.',
};

export const viewport = { themeColor: '#172022' };

export default function RootLayout({ children }) {
  return <html lang="sv"><body>{children}</body></html>;
}
