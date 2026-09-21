import './globals.css';

export const metadata = {
  title: 'Central de Crédito',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
